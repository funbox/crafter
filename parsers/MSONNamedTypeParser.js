const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    parse(node, context) {
      return [utils.nextNode(curNode), new MSONNamedTypeElement()];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
      }

      return SectionTypes.undefined;
    }
  });
};