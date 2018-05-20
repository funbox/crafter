const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const Refract = require('../Refract');

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    result.element = Refract.elements.resourcePrototype;

    return utils.nextNode(node);
  },

  sectionType(node, context) {
    if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
      return SectionTypes.resourcePrototype;
    }

    return SectionTypes.undefined;
  }
});