const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SampleValueElement = require('./elements/SampleValueElement');

const sampleValueRegex = /^[Ss]ample:\s*`?(.+?)`?$/;

module.exports = (Parsers) => {
  Parsers.SampleValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const val = sampleValueRegex.exec(text)[1];
      return [utils.nextNode(node), new SampleValueElement(val)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (sampleValueRegex.exec(text)) {
          return SectionTypes.sampleValue;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
