const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const parameterDefaultValueRegex = /^[Dd]efault:\s*`?(.+?)`?$/;

module.exports = (Parsers) => {
  Parsers.ParameterDefaultValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
      const val = parameterDefaultValueRegex.exec(text)[1];

      result.element = Refract.elements.string;
      result.content = val;

      return utils.nextNode(node);
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

    processDescription(node) {
      return node;
    }
  });
};