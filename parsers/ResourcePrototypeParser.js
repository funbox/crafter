const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ResourcePrototypeElement = require('./elements/ResourcePrototypeElement');

module.exports = (Parsers) => {
  Parsers.ResourcePrototypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      return [utils.nextNode(node), new ResourcePrototypeElement()];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.resourcePrototype;
      }

      return SectionTypes.undefined;
    },

    skipSectionKeywordSignature: true,
  });
};