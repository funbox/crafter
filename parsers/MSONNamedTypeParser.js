const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');
const StringElement = require('./elements/StringElement');
const EnumElement = require('./elements/EnumElement');
const ObjectElement = require('./elements/ObjectElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberProcessor = require('../ValueMemberProcessor');

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);
      const signature = new SignatureParser(subject, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
      signature.warnings.forEach(warning => context.logger.warn(warning, utils.getDetailsForLogger(node)));

      const name = new StringElement(signature.name);
      if (context.sourceMapsEnabled) {
        name.sourceMap = utils.makeGenericSourceMap(node, context.sourceLines);
      }

      const typeElement = new MSONNamedTypeElement(name, signature.type, signature.typeAttributes);
      if (!context.typeExtractingInProgress) {
        ValueMemberProcessor.fillBaseType(context, typeElement.content);
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
      if (!node) {
        return [node, result];
      }
      const contentNode = node.parent;

      if (!context.typeExtractingInProgress) {
        let type = result.content.type || types.object;

        if (context.typeResolver.types[type]) {
          type = context.typeResolver.getStandardBaseType(type);
        }

        if (Parsers.NamedTypeMemberGroupParser.sectionType(node, context) !== SectionTypes.undefined) {
          const [nextNode, childRes] = Parsers.NamedTypeMemberGroupParser.parse(node, context);
          fillElementWithContent(result.content, type, childRes.members);

          return [nextNode, result];
        }

        if (contentNode.type === 'list') {
          const dataStructureProcessor = new DataStructureProcessor(contentNode, Parsers);
          dataStructureProcessor.fillValueMember(result.content, context);
        } else {
          return [node, result];
        }
      } else if (node.type === 'heading') {
        const returnNode = Parsers.NamedTypeMemberGroupParser.sectionType(node, context) !== SectionTypes.undefined
          ? utils.nextNodeOfType(node, 'heading') : node;
        return [returnNode, result];
      }

      return [utils.nextNode(contentNode), result];
    },

    processDescription(node, context, result) {
      if (node && node.type === 'paragraph') {
        const [curNode, desc] = utils.extractDescription(node, context.sourceLines, context.sourceMapsEnabled);

        result.description = desc;

        return [curNode, result];
      }

      return [node, result];
    },

    finalize(context, result) {
      const valueMemberContent = result.content.content;
      if (!valueMemberContent) {
        let type = result.content.type || types.object;

        if (context.typeResolver.types[type]) {
          type = context.typeResolver.getStandardBaseType(type);
        }
        fillElementWithContent(result.content, type);
      }
      return result;
    },
  });
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
