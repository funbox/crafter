const SectionTypes = require('../SectionTypes');
const { types } = require('../constants');
const utils = require('../utils');
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
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
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

      const resolvedType = utils.resolveType(signature.type);
      const nestedTypes = resolvedType.nestedTypes.map((nestedType, index) => {
        const el = new ValueMemberElement(nestedType, nestedType, []);
        el.sourceMap = utils.makeSourceMapsForString(
          nestedType,
          resolvedType.nestedTypesOffsets[index] + signature.typeOffset + subjectOffset,
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
          context.filename,
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

        valueMemberSourceMaps.push(utils.makeSourceMapsForStartPosAndLength(
          offset + subjectOffset,
          length,
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
          context.filename,
        ));
      });

      if (signature.type) {
        valueMemberSourceMaps.push(utils.makeSourceMapsForString(
          signature.type,
          signature.typeOffset + subjectOffset,
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
          context.filename,
        ));
      }

      valueMemberSourceMaps.sort((sm1, sm2) => sm1.byteBlocks[0].offset - sm2.byteBlocks[0].offset);

      if (valueMemberSourceMaps.length) {
        valueElement.sourceMap = utils.concatSourceMaps(valueMemberSourceMaps);
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

      return [utils.nextNode(node), typeElement];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
      }

      return SectionTypes.undefined;
    },

    processNestedSections(node, context, result) {
      let curNode = node;
      const valueMemberDefaults = [];

      while (curNode) {
        if (curNode.type === 'item') {
          if (!context.typeExtractingInProgress) {
            const dataStructureProcessor = new DataStructureProcessor(curNode.parent, Parsers, undefined, curNode.parent);
            const isFixedOrFixedType = result.content.typeAttributes.includes('fixed') || result.content.typeAttributes.includes('fixedType');
            const isFixedOrFixedTypePropagated = result.content.propagatedTypeAttributes
              && (result.content.propagatedTypeAttributes.includes('fixed') || result.content.propagatedTypeAttributes.includes('fixedType'));
            context.data.isParentAttributeFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedType || isFixedOrFixedTypePropagated;
            context.data.isNamedTypeSection = true;
            dataStructureProcessor.fillValueMember(result.content, context);
            delete context.data.isParentAttributeFixedOrFixedType;
            delete context.data.isNamedTypeSection;
          }

          curNode = utils.nextNode(curNode.parent);
        } else if (Parsers.NamedTypeMemberGroupParser.sectionType(curNode, context) !== SectionTypes.undefined) {
          if (!context.typeExtractingInProgress) {
            let type = result.content.type || types.object;

            if (context.typeResolver.types[type]) {
              type = context.typeResolver.getStandardBaseType(type);
            }
            context.data.isNamedTypeSection = true;
            context.data.parentType = type;
            context.data.parentNestedTypes = result.content.nestedTypes;

            const [nextNode, memberGroup] = Parsers.NamedTypeMemberGroupParser.parse(curNode, context);

            delete context.data.parentType;
            delete context.data.parentNestedTypes;
            delete context.data.isNamedTypeSection;

            if (memberGroup.childValueMember) {
              const { childValueMember } = memberGroup;
              const rootValueMember = result.content;
              const membersField = type === types.object ? 'propertyMembers' : 'members';
              const contentMembers = childValueMember.content[membersField];

              if (!rootValueMember.content) {
                rootValueMember.content = childValueMember.content;
              } else {
                rootValueMember.content[membersField].push(...contentMembers);
              }

              if (childValueMember.unrecognizedBlocks.length > 0) {
                appendUnrecognizedBlocks(childValueMember.unrecognizedBlocks.map(ub => ub.sourceMap));
              }

              const contentMembersSourceMaps = contentMembers.map(cm => cm.sourceMap);
              if (rootValueMember.sourceMap) {
                rootValueMember.sourceMap = utils.concatSourceMaps([rootValueMember.sourceMap, ...contentMembersSourceMaps]);
              } else {
                rootValueMember.sourceMap = utils.concatSourceMaps(contentMembersSourceMaps);
              }
            }

            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
            if (result.content.sourceMap) {
              result.content.sourceMap = utils.concatSourceMaps([result.content.sourceMap, sourceMap]);
            } else {
              result.content.sourceMap = sourceMap;
            }

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
              const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
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
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
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
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
                context.addWarning('Samples of enum of non-primitive types are not supported', sourceMap);
              }
            }

            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
            if (result.content.sourceMap) {
              result.content.sourceMap = utils.concatSourceMaps([result.content.sourceMap, sourceMap]);
            } else {
              result.content.sourceMap = sourceMap;
            }
          }

          let lastNodeOfSection = curNode;
          let nextNode = curNode;
          do {
            lastNodeOfSection = nextNode;
            nextNode = utils.nextNode(nextNode);
          } while (nextNode && nextNode.type !== 'heading');

          if (unrecognizedBlockDetected) {
            const sourceMap = utils.makeGenericSourceMapFromStartAndEndNodes(
              curNode,
              lastNodeOfSection,
              context.sourceLines,
              context.sourceBuffer,
              context.linefeedOffsets,
              context.filename,
            );
            appendUnrecognizedBlocks([sourceMap]);
          }

          curNode = nextNode;
        } else if (Parsers.DefaultHeaderParser.sectionType(curNode, context) !== SectionTypes.undefined) {
          let unrecognizedBlockDetected = false;

          if (!context.typeExtractingInProgress) {
            const valueMember = result.content;

            if (!valueMember.isComplex()) {
              assignValueMemberDefault(valueMember, 'primitive', valueMember.type, valueMemberDefaults);
            }

            if (valueMember.isObject()) {
              const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
              throw new utils.CrafterError('Default is not supported for objects', sourceMap);
            }

            if (valueMember.isArray()) {
              const arrayElement = valueMember.content;
              const arrayMembers = arrayElement.members;
              const predefinedType = (arrayMembers.length && arrayMembers[0].type) || 'string';
              const hasComplexMembers = arrayElement.isComplex();

              if (!hasComplexMembers) {
                assignValueMemberDefault(valueMember, 'array', predefinedType, valueMemberDefaults);
              } else {
                unrecognizedBlockDetected = true;
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
                context.addWarning('Default values of arrays of non-primitive types are not supported', sourceMap);
              }
            }

            if (valueMember.isEnum()) {
              const enumElement = valueMember.content;

              if (!enumElement) {
                unrecognizedBlockDetected = true;
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
                context.addWarning(`Enum element "${result.name.string}" should include members.`, sourceMap);
              } else if (!enumElement.isComplex()) {
                assignValueMemberDefault(valueMember, 'enum', enumElement.type, valueMemberDefaults);
              } else {
                unrecognizedBlockDetected = true;
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
                context.addWarning('Default values of enum of non-primitive types are not supported', sourceMap);
              }
            }

            const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
            if (result.content.sourceMap) {
              result.content.sourceMap = utils.concatSourceMaps([result.content.sourceMap, sourceMap]);
            } else {
              result.content.sourceMap = sourceMap;
            }
          }

          let lastNodeOfSection = curNode;
          let nextNode = curNode;
          do {
            lastNodeOfSection = nextNode;
            nextNode = utils.nextNode(nextNode);
          } while (nextNode && nextNode.type !== 'heading');

          if (unrecognizedBlockDetected) {
            const sourceMap = utils.makeGenericSourceMapFromStartAndEndNodes(
              curNode,
              lastNodeOfSection,
              context.sourceLines,
              context.sourceBuffer,
              context.linefeedOffsets,
              context.filename,
            );
            appendUnrecognizedBlocks([sourceMap]);
          }

          curNode = nextNode;
        } else {
          break;
        }
      }

      return [curNode, result];

      function assignValueMemberDefault(valueMember, type, valueType, acc) {
        context.data.typeForDefaults = type;
        context.data.valueType = valueType;

        const [, childResult] = Parsers.DefaultHeaderParser.parse(curNode, context);

        delete context.data.typeForDefaults;
        delete context.data.valueType;

        acc.push(...childResult);

        if (acc.length) {
          const childSourceMaps = acc.map(child => child.sourceMap).flat();

          concatSourceMaps(valueMember, childSourceMaps);

          if (acc.length > 1) {
            const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);

            context.addWarning('Multiple definitions of "default" value', sourceMap);
            appendUnrecognizedBlocks(acc.slice(1).map(d => d.sourceMap).flat());
          }

          if (type === 'enum') {
            valueMember.content.defaultValue = acc[0];
            valueMember.default = acc[0];
          } else {
            valueMember.default = acc[0];
          }
        }
      }

      function appendUnrecognizedBlocks(sourceMaps) {
        result.content.unrecognizedBlocks.push(
          ...sourceMaps.map(sm => new UnrecognizedBlockElement(sm)),
        );

        const sm = utils.concatSourceMaps(sourceMaps);
        if (result.content.sourceMap) {
          result.content.sourceMap = utils.concatSourceMaps([result.content.sourceMap, sm]);
        } else {
          result.content.sourceMap = sm;
        }
      }
    },

    processDescription(node, context, result) {
      if (node && node.type === 'paragraph') {
        const { sourceLines, sourceBuffer, linefeedOffsets, filename } = context;
        const [curNode, desc] = utils.extractDescription(node, sourceLines, sourceBuffer, linefeedOffsets, filename);

        result.description = desc;

        if (result.content.sourceMap) {
          result.content.sourceMap = utils.concatSourceMaps([result.content.sourceMap, result.description.sourceMap]);
        } else {
          result.content.sourceMap = result.description.sourceMap;
        }

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

      if (result.content.sourceMap) {
        result.sourceMap = utils.concatSourceMaps([result.sourceMap, result.content.sourceMap]);
      }

      utils.validateAttributesConsistency(context, result.content, attributeSignatureDetails);

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
        rootElement.sourceMap = utils.concatSourceMaps([rootElement.sourceMap, ...contentMembersSourceMaps]);
      } else {
        rootElement.sourceMap = utils.concatSourceMaps(contentMembersSourceMaps);
      }
    }
  }

  rootElement.content = newContentElement;
}

function concatSourceMaps(valueMember, childSourceMaps) {
  if (valueMember.sourceMap) {
    valueMember.sourceMap = utils.concatSourceMaps([valueMember.sourceMap, ...childSourceMaps]);
  } else {
    valueMember.sourceMap = utils.concatSourceMaps(childSourceMaps);
  }
}
