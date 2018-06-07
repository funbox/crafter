const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ResourcePrototypeElement = require('./elements/ResourcePrototypeElement');

module.exports = (Parsers) => {
  Parsers.ResourcePrototypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);

      return [utils.nextNode(node), new ResourcePrototypeElement(subject)];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.resourcePrototype;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResponseParser.sectionType(node, context);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResponseParser.parse(node, context);
      result.responses.push(childResult);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    skipSectionKeywordSignature: true,
  });
};