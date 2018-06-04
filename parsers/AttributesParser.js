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
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.MSONAttributeParser,
        Parsers.MSONMixinParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      if (Parsers.MSONAttributeParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
      } else {
        [nextNode, childResult] = Parsers.MSONMixinParser.parse(node, context);
      }

      result.object.content.push(childResult);
      return [nextNode, result];
    },

    finalize(context, result) {
      context.typeResolver.resolve(result.object);
      return result;
    }
  });
};