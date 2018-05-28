const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const BodyElement = require('./elements/BodyElement');

const bodyRegex = /^[Bb]ody$/;

module.exports = (Parsers) => {
  Parsers.BodyParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      const bodyContentNode = node.firstChild.next;
      const body = bodyContentNode && bodyContentNode.literal || '';
      return [utils.nextNode(node), new BodyElement(body)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
        if (bodyRegex.exec(text)) {
          return SectionTypes.response;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};