const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');
const ValueMemberElement = require('./elements/ValueMemberElement');
const EnumElement = require('./elements/EnumElement');
const ObjectElement = require('./elements/ObjectElement');
const SchemaNamedTypeElement = require('./elements/SchemaNamedTypeElement');
const UnrecognizedBlockElement = require('./elements/UnrecognizedBlockElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberProcessor = require('../ValueMemberProcessor');

const { CrafterError } = utils;

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      context.pushFrame();

      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      let signature;
      try {
        signature = new SignatureParser(subject, context.languageServerMode, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
      } catch (e) {
        if (!(e instanceof utils.SignatureError)) {
          throw e;
        } else {
          const hashSymbols = Array(node.level).fill('#').join('');
          const message = `Invalid NamedType definition. Expected format: "${hashSymbols} Type Name (Type Attributes)".`;
          throw new CrafterError(message, sourceMap);
        }
      }
      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      context.data.attributeSignatureDetails = { sourceMap, node };

      const resolvedType = utilsHelpers.resolveType(signature.type);
      const nestedTypes = resolvedType.nestedTypes.map((nestedType, index) => {
        const el = new ValueMemberElement(nestedType, nestedType, []);
        el.sourceMap = utilsHelpers.makeSourceMapsForString(
          nestedType,
          resolvedType.nestedTypesOffsets[index] + signature.typeOffset + subjectOffset,
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        );
        return el;
      });
      const valueElement = new ValueMemberElement(
        signature.type,
        resolvedType.type,
        nestedTypes,
        signature.typeAttributes,
      );

      const valueMemberSourceMaps = [];

      signature.typeAttributes.forEach((attr, index) => {
        const [offset, length] = signature.typeAttributesOffsetsAndLengths[index];

        valueMemberSourceMaps.push(utilsHelpers.makeSourceMapsForStartPosAndLength(
          offset + subjectOffset,
          length,
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      });

      if (signature.type) {
        valueMemberSourceMaps.push(utilsHelpers.makeSourceMapsForString(
          signature.type,
          signature.typeOffset + subjectOffset,
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      }

      valueMemberSourceMaps.sort((sm1, sm2) => sm1.byteBlocks[0].offset - sm2.byteBlocks[0].offset);

      if (valueMemberSourceMaps.length) {
        valueElement.sourceMap = utilsHelpers.concatSourceMaps(valueMemberSourceMaps);
      }

      const name = utils.makeStringElement(signature.name, signature.nameOffset + subjectOffset, node, context);
      const typeElement = new MSONNamedTypeElement(name, valueElement, sourceMap);

      if (!context.typeExtractingInProgress) {
        const typeEl = context.typeResolver.types[signature.type];
        if (typeEl && typeEl instanceof SchemaNamedTypeElement && !context.languageServerMode) {
          throw new CrafterError('No inheritance allowed from schema named type.', sourceMap);
        }

        try {
          ValueMemberProcessor.fillBaseType(context, typeElement.content);
        } catch (error) {
          if (!error.sourceMap) {
            error.sourceMap = typeElement.name.sourceMap;
          }
          throw error;
        }
      }

      return [utilsHelpers.nextNode(node), typeElement];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
      }

      return SectionTypes.undefined;
    },

    processNestedSections(node, context, result) {
      let curNode = node;

      while (curNode) {
        if (curNode.type === 'item') {
          if (!context.typeExtractingInProgress) {
            const dataStructureProcessor = new DataStructureProcessor(curNode.parent, Parsers);
            const isFixedOrFixedType = result.content.typeAttributes.includes('fixed') || result.content.typeAttributes.includes('fixedType');
            const isFixedOrFixedTypePropagated = result.content.propagatedTypeAttributes
              && (result.content.propagatedTypeAttributes.includes('fixed') || result.content.propagatedTypeAttributes.includes('fixedType'));
            context.data.isParentAttributeFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedType || isFixedOrFixedTypePropagated;
            context.data.isNamedTypeSection = true;
            dataStructureProcessor.fillValueMember(result.content, context);
            delete context.data.isParentAttributeFixedOrFixedType;
            delete context.data.isNamedTypeSection;
          }

          curNode = utilsHelpers.nextNode(curNode.parent);
        } else if (Parsers.NamedTypeMemberGroupParser.sectionType(curNode, context) !== SectionTypes.undefined) {
          if (!context.typeExtractingInProgress) {
            let type = result.content.type || types.object;

            if (context.typeResolver.types[type]) {
              type = context.typeResolver.getStandardBaseType(type);
            }

            const [nextNode, childRes] = Parsers.NamedTypeMemberGroupParser.parse(curNode, context);
            fillElementWithContent(result.content, type, childRes.members);
            curNode = nextNode;
          } else {
            curNode = utils.nextNodeOfType(curNode, 'heading');
          }
        } else if (Parsers.SampleHeaderParser.sectionType(curNode, context) !== SectionTypes.undefined) {
          let unrecognizedBlockDetected = false;

          if (!context.typeExtractingInProgress) {
            const valueMember = result.content;

            if (!valueMember.isComplex()) {
              context.data.typeForSamples = 'primitive';
              context.data.valueType = valueMember.type;
              const [, childResult] = Parsers.SampleHeaderParser.parse(curNode, context);
              delete context.data.typeForSamples;
              delete context.data.valueType;

              if (childResult.length) {
                valueMember.samples = valueMember.samples || [];
                valueMember.samples.push(...childResult);

                const childSourceMaps = [];
                childResult.forEach(child => childSourceMaps.push(child.sourceMap));
                concatSourceMaps(valueMember, childSourceMaps);
              }
            }

            if (valueMember.isObject()) {
              const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
              throw new utils.CrafterError('Sample is not supported for objects', sourceMap);
            }

            if (valueMember.isArray()) {
              const arrayElement = valueMember.content;
              const arrayMembers = arrayElement.members;
              const predefinedType = (arrayMembers.length && arrayMembers[0].type) || 'string';
              const hasComplexMembers = arrayElement.isComplex();

              if (!hasComplexMembers) {
                context.data.typeForSamples = 'array';
                context.data.valueType = predefinedType;
                const [, childResult] = Parsers.SampleHeaderParser.parse(curNode, context);
                delete context.data.typeForSamples;
                delete context.data.valueType;

                if (childResult.length) {
                  valueMember.samples = valueMember.samples || [];
                  valueMember.samples.push(...childResult);

                  const childSourceMaps = [];
                  childResult.forEach(child => {
                    childSourceMaps.push(...child.sourceMap);
                  });
                  concatSourceMaps(valueMember, childSourceMaps);
                }
              } else {
                unrecognizedBlockDetected = true;
                const sourceMap = utilsHelpers.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                context.addWarning('Samples of arrays of non-primitive types are not supported', sourceMap);
              }
            }

            if (valueMember.isEnum()) {
              const enumElement = valueMember.content;
              const hasComplexMembers = enumElement.isComplex();

              if (!hasComplexMembers) {
                context.data.typeForSamples = 'enum';
                context.data.valueType = enumElement.type;
                const [, childResult] = Parsers.SampleHeaderParser.parse(curNode, context);
                delete context.data.typeForSamples;
                delete context.data.valueType;
                if (childResult.length) {
                  enumElement.sampleValues = childResult;

                  const childSourceMaps = childResult.map(child => child.sourceMap);
                  concatSourceMaps(valueMember, childSourceMaps);
                }
              } else {
                unrecognizedBlockDetected = true;
                const sourceMap = utilsHelpers.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                context.addWarning('Samples of enum of non-primitive types are not supported', sourceMap);
              }
            }
          }

          let lastNodeOfSection = curNode;
          let nextNode = curNode;
          do {
            lastNodeOfSection = nextNode;
            nextNode = utils.nextNode(nextNode);
          } while (nextNode && nextNode.type !== 'heading');

          if (unrecognizedBlockDetected) {
            const sourceMap = utils.makeGenericSourceMapFromStartAndEndNodes(curNode, lastNodeOfSection, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            appendUnrecognizedBlocks([sourceMap]);
          }

          curNode = nextNode;
        } else if (Parsers.DefaultHeaderParser.sectionType(curNode, context) !== SectionTypes.undefined) {
          let unrecognizedBlockDetected = false;

          if (!context.typeExtractingInProgress) {
            const valueMember = result.content;

            if (!valueMember.isComplex()) {
              const defaults = [];

              context.data.typeForDefaults = 'primitive';
              context.data.valueType = valueMember.type;
              const [, childResult] = Parsers.DefaultHeaderParser.parse(curNode, context);
              delete context.data.typeForDefaults;
              delete context.data.valueType;
              defaults.push(...childResult);

              const childSourceMaps = childResult.map(child => child.sourceMap);
              concatSourceMaps(valueMember, childSourceMaps);

              if (defaults.length) {
                if (defaults.length > 1) {
                  const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                  context.addWarning('Multiple definitions of "default" value', sourceMap);

                  appendUnrecognizedBlocks(defaults.slice(1).map(d => d.sourceMap));
                }
                valueMember.default = defaults[0];
              }
            }

            if (valueMember.isObject()) {
              const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
              throw new utils.CrafterError('Default is not supported for objects', sourceMap);
            }

            if (valueMember.isArray()) {
              const arrayElement = valueMember.content;
              const arrayMembers = arrayElement.members;
              const predefinedType = (arrayMembers.length && arrayMembers[0].type) || 'string';
              const hasComplexMembers = arrayElement.isComplex();

              if (!hasComplexMembers) {
                context.data.typeForDefaults = 'array';
                context.data.valueType = predefinedType;
                const [, childResult] = Parsers.DefaultHeaderParser.parse(curNode, context);
                delete context.data.typeForDefaults;
                delete context.data.valueType;
                if (childResult.length) {
                  const childSourceMaps = [];
                  childResult.forEach(child => {
                    childSourceMaps.push(...child.sourceMap);
                  });
                  concatSourceMaps(valueMember, childSourceMaps);

                  if (childResult.length > 1) {
                    const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                    context.addWarning('Multiple definitions of "default" value', sourceMap);

                    appendUnrecognizedBlocks(childResult.slice(1).map(d => d.sourceMap));
                  }
                  valueMember.default = childResult[0];
                }
              } else {
                unrecognizedBlockDetected = true;
                const sourceMap = utilsHelpers.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                context.addWarning('Default values of arrays of non-primitive types are not supported', sourceMap);
              }
            }

            if (valueMember.isEnum()) {
              const enumElement = valueMember.content;
              const hasComplexMembers = enumElement.isComplex();

              if (!hasComplexMembers) {
                context.data.typeForDefaults = 'enum';
                context.data.valueType = enumElement.type;
                const [, childResult] = Parsers.DefaultHeaderParser.parse(curNode, context);
                delete context.data.typeForDefaults;
                delete context.data.valueType;
                if (childResult.length) {
                  const childSourceMaps = childResult.map(child => child.sourceMap);
                  concatSourceMaps(valueMember, childSourceMaps);

                  if (childResult.length > 1) {
                    const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                    context.addWarning('Multiple definitions of "default" value', sourceMap);

                    appendUnrecognizedBlocks(childResult.slice(1).map(d => d.sourceMap));
                  }
                  enumElement.defaultValue = childResult[0];
                }
              } else {
                unrecognizedBlockDetected = true;
                const sourceMap = utilsHelpers.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                context.addWarning('Default values of enum of non-primitive types are not supported', sourceMap);
              }
            }
          }

          let lastNodeOfSection = curNode;
          let nextNode = curNode;
          do {
            lastNodeOfSection = nextNode;
            nextNode = utils.nextNode(nextNode);
          } while (nextNode && nextNode.type !== 'heading');

          if (unrecognizedBlockDetected) {
            const sourceMap = utils.makeGenericSourceMapFromStartAndEndNodes(curNode, lastNodeOfSection, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            appendUnrecognizedBlocks([sourceMap]);
          }

          curNode = nextNode;
        } else {
          break;
        }
      }

      if (result.content.sourceMap) {
        const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
        const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
        result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, result.content.sourceMap], sourceBuffer, linefeedOffsets);
      }

      return [curNode, result];

      function appendUnrecognizedBlocks(sourceMaps) {
        result.content.unrecognizedBlocks.push(
          ...sourceMaps.map(sm => new UnrecognizedBlockElement(sm)),
        );

        const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
        const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
        const sm = utils.concatSourceMaps(sourceMaps, sourceBuffer, linefeedOffsets);
        if (result.content.sourceMap) {
          result.content.sourceMap = utils.concatSourceMaps([result.content.sourceMap, sm], sourceBuffer, linefeedOffsets);
        } else {
          result.content.sourceMap = sm;
        }
      }
    },

    processDescription(node, context, result) {
      if (node && node.type === 'paragraph') {
        const [curNode, desc] = utils.extractDescription(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

        result.description = desc;
        const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
        const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
        result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, result.description.sourceMap], sourceBuffer, linefeedOffsets);

        return [curNode, result];
      }

      return [node, result];
    },

    finalize(context, result) {
      const valueMemberContent = result.content.content;
      const { attributeSignatureDetails } = context.data;

      if (!valueMemberContent) {
        let type = result.content.type || types.object;

        if (context.typeResolver.types[type]) {
          type = context.typeResolver.getStandardBaseType(type);
        }
        fillElementWithContent(result.content, type);
      }

      utilsHelpers.validateAttributesConsistency(context, result.content, attributeSignatureDetails);

      context.popFrame();

      return result;
    },
  });
  return true;
};

function fillElementWithContent(rootElement, elementType, contentMembers) {
  const existingContentElement = rootElement.content;
  let newContentElement;

  if (!rootElement.isComplex()) return;

  switch (elementType) {
    case types.object:
      newContentElement = existingContentElement || new ObjectElement();
      break;
    case types.enum:
      newContentElement = existingContentElement || new EnumElement(rootElement.nestedTypes);
      break;
    case types.array:
      newContentElement = existingContentElement;
      break;
    default:
      break;
  }

  if (Array.isArray(contentMembers)) {
    const membersField = elementType === types.object ? 'propertyMembers' : 'members';
    newContentElement[membersField].push(...contentMembers);

    if (contentMembers.length) {
      const contentMembersSourceMaps = contentMembers.map(cm => cm.sourceMap);
      if (rootElement.sourceMap) {
        rootElement.sourceMap = utilsHelpers.concatSourceMaps([rootElement.sourceMap, ...contentMembersSourceMaps]);
      } else {
        rootElement.sourceMap = utilsHelpers.concatSourceMaps(contentMembersSourceMaps);
      }
    }
  }

  rootElement.content = newContentElement;
}

function concatSourceMaps(valueMember, childSourceMaps) {
  if (valueMember.sourceMap) {
    valueMember.sourceMap = utilsHelpers.concatSourceMaps([valueMember.sourceMap, ...childSourceMaps]);
  } else {
    valueMember.sourceMap = utilsHelpers.concatSourceMaps(childSourceMaps);
  }
}
