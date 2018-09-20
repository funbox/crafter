const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const AttributesElement = require('./elements/AttributesElement');
const DataStructureProcessor = require('./DataStructureProcessor');

const attributesRegex = /^[Aa]ttributes?$/;

module.exports = (Parsers) => {
  Parsers.AttributesParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
      return [utils.nextNode(node.firstChild), new AttributesElement(signature.type, signature.typeAttributes)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (attributesRegex.exec(signature.name)) {
            return SectionTypes.attributes;
          }
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
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

      context.typeResolver.checkUsedMixins(result.content);
      return [utils.nextNode(contentNode), result];
    },
  });
};
