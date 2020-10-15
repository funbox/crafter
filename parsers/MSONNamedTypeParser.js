const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const { parser: SignatureParser, traits: ParserTraits, typeAttributes } = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');
const StringElement = require('./elements/StringElement');
const EnumElement = require('./elements/EnumElement');
const ObjectElement = require('./elements/ObjectElement');
const SchemaNamedTypeElement = require('./elements/SchemaNamedTypeElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberProcessor = require('../ValueMemberProcessor');

const { CrafterError } = utils;

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const [subject, subjectOffset] = utils.headerText(node, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      let signature;
      try {
        signature = new SignatureParser(subject, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
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

      const nameSourceMap = utils.makeSourceMapsForString(
        signature.name,
        signature.nameOffset + subjectOffset,
        node,
        context.sourceLines,
        context.sourceBuffer,
        context.linefeedOffsets,
      );
      const name = new StringElement(signature.name, nameSourceMap);

      const typeElement = new MSONNamedTypeElement(name, signature.type, signature.typeAttributes);

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
        ));
      }

      valueMemberSourceMaps.sort((sm1, sm2) => sm1.byteBlocks[0].offset - sm2.byteBlocks[0].offset);

      if (valueMemberSourceMaps.length) {
        typeElement.content.sourceMap = utils.concatSourceMaps(valueMemberSourceMaps);
      }

      if (!context.typeExtractingInProgress) {
        const typeEl = context.typeResolver.types[signature.type];
        if (typeEl && typeEl instanceof SchemaNamedTypeElement) {
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

      while (curNode) {
        if (curNode.type === 'item') {
          if (!context.typeExtractingInProgress) {
            const dataStructureProcessor = new DataStructureProcessor(curNode.parent, Parsers);
            const isFixedOrFixedType = result.content.typeAttributes.includes('fixed') || result.content.typeAttributes.includes('fixedType');
            context.data.isParentAttributeFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedType;
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

            const [nextNode, childRes] = Parsers.NamedTypeMemberGroupParser.parse(curNode, context);
            fillElementWithContent(result.content, type, childRes.members);
            curNode = nextNode;
          } else {
            curNode = utils.nextNodeOfType(curNode, 'heading');
          }
        } else if (Parsers.SampleHeaderParser.sectionType(curNode, context) !== SectionTypes.undefined) {
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
                childResult.forEach(sample => childSourceMaps.push(sample.sourceMap));

                if (valueMember.sourceMap) {
                  valueMember.sourceMap = utils.concatSourceMaps([valueMember.sourceMap, ...childSourceMaps]);
                } else {
                  valueMember.sourceMap = utils.concatSourceMaps(childSourceMaps);
                }
              }
            }

            if (valueMember.isObject()) {
              const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
                }
              } else {
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
                }
              } else {
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                context.addWarning('Samples of enum of non-primitive types are not supported', sourceMap);
              }
            }
          }
          curNode = utils.nextNodeOfType(curNode, 'heading');
        } else if (Parsers.DefaultHeaderParser.sectionType(curNode, context) !== SectionTypes.undefined) {
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

              if (defaults.length) {
                if (defaults.length > 1) {
                  const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                  context.addWarning('Multiple definitions of "default" value', sourceMap);
                }
                valueMember.default = defaults[0];
              }
            }

            if (valueMember.isObject()) {
              const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
                  if (childResult.length > 1) {
                    const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                    context.addWarning('Multiple definitions of "default" value', sourceMap);
                  }
                  valueMember.default = childResult[0];
                }
              } else {
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
                  if (childResult.length > 1) {
                    const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                    context.addWarning('Multiple definitions of "default" value', sourceMap);
                  }
                  enumElement.defaultValue = childResult[0];
                }
              } else {
                const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
                context.addWarning('Default values of enum of non-primitive types are not supported', sourceMap);
              }
            }
          }
          curNode = utils.nextNodeOfType(curNode, 'heading');
        } else {
          return [curNode, result];
        }
      }

      return [curNode, result];
    },

    processDescription(node, context, result) {
      if (node && node.type === 'paragraph') {
        const [curNode, desc] = utils.extractDescription(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

        result.description = desc;

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

      utils.validateAttributesConsistency(context, result.content, attributeSignatureDetails, typeAttributes);

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
      newContentElement = existingContentElement || new EnumElement(rootElement.rawType);
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
  }

  rootElement.content = newContentElement;
}
