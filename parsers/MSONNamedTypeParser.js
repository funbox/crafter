const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');
const StringElement = require('./elements/StringElement');
const DataStructureProcessor = require('./DataStructureProcessor');

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);
      const signature = new SignatureParser(subject, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);

      const name = new StringElement(signature.name);
      if (context.sourceMapsEnabled) {
        name.sourceMap = utils.makeGenericSourceMap(node, context.sourceLines);
      }

      return [utils.nextNode(node), new MSONNamedTypeElement(name, signature.type, signature.typeAttributes)];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.OneOfTypeParser,
        Parsers.MSONMixinParser,
        Parsers.MSONAttributeParser,
      ]);
    },

    processNestedSections(node, context, result) {
      if (!node) {
        return [node, result];
      }

      const contentNode = node.parent;
      if (contentNode.type === 'list') {
        const dataStructureProcessor = new DataStructureProcessor(contentNode, Parsers);
        dataStructureProcessor.fillValueMember(result.content, context);
      } else {
        // TODO: Что делать в этом случае?
      }

      return [utils.nextNode(contentNode), result];
    },

    processDescription(node, context, result) {
      return [node, result]; // TODO: Сделать обработку description для этого парсера
    },
  });
};
