const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SignatureParser = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);
      const signature = new SignatureParser(subject);

      return [utils.nextNode(node), new MSONNamedTypeElement(signature.name, signature.type)];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
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

      result.content.push(childResult);
      return [nextNode, result];
    },

    skipSectionKeywordSignature: true,
  });
};