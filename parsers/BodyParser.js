const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const bodyRegex = /^[Bb]ody$/;

module.exports = (Parsers) => {
  Parsers.BodyParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      result.element = Refract.elements.asset;

      result.meta = {
        classes: [
          Refract.categoryClasses.messageBody
        ]
      };

      const bodyContentNode = node.firstChild.next;

      result.content = bodyContentNode && bodyContentNode.literal || '';

      return utils.nextNode(node);
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

    processDescription(node) {
      return node;
    },
  });
};