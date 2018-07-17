const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const DefaultValueElement = require('./elements/DefaultValueElement');

const defaultValueRegex = /^[Dd]efault:\s*`?(.+?)`?$/;

module.exports = (Parsers) => {
  Parsers.DefaultValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const val = defaultValueRegex.exec(text)[1];
      return [utils.nextNode(node), new DefaultValueElement(val)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (defaultValueRegex.exec(text)) {
          return SectionTypes.defaultValue;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
