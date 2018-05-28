const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ParameterDefaultValueElement = require('./elements/ParameterDefaultValueElement');

const parameterDefaultValueRegex = /^[Dd]efault:\s*`?(.+?)`?$/;

module.exports = (Parsers) => {
  Parsers.ParameterDefaultValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
      const val = parameterDefaultValueRegex.exec(text)[1];
      return [utils.nextNode(node), new ParameterDefaultValueElement(val)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
        if (parameterDefaultValueRegex.exec(text)) {
          return SectionTypes.parameterDefaultValue;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    }
  });
};