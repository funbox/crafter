const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SignatureParser = require('../SignatureParser');
const AttributesElement = require('./elements/AttributesElement');

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

    nestedSectionType(node, context) {
      return Parsers.MSONAttributeParser.sectionType(node, context);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
      result.attributes.push(childResult);
      return [nextNode, result];
    },

    finalize(context, result) {
      context.typeResolver.resolve(result);
      return result;
    }
  });
};