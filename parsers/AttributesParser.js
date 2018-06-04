const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SignatureParser = require('../SignatureParser');
const AttributesElement = require('./elements/AttributesElement');
const ObjectProcessor = require('./ObjectProcessor');

const attributesRegex = /^[Aa]ttributes?$/;

module.exports = (Parsers) => {
  Parsers.AttributesParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text);
      return [utils.nextNode(node.firstChild), new AttributesElement(signature.type)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (attributesRegex.exec(signature.name)) {
            return SectionTypes.attributes;
          }
        } catch (e) {
        }
      }

      return SectionTypes.undefined;
    },

    processNestedSections(node, context, result) {
      if (!node) {
        return [node, result];
      }

      let contentNode = node.parent;
      if (contentNode.type === 'list') {
        const objectProcessor = new ObjectProcessor(contentNode, Parsers);
        objectProcessor.fillObject(result.object, context);
      } else {
        // TODO: Что делать в этом случае?
      }

      return [utils.nextNode(contentNode), result];
    },

    finalize(context, result) {
      context.typeResolver.resolve(result.object);
      return result;
    }
  });
};