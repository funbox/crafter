const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const BodyElement = require('./elements/BodyElement');

const bodyRegex = /^[Bb]ody$/;

module.exports = (Parsers) => {
  Parsers.BodyParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const bodyContentNode = node.firstChild.next;

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      if (!bodyContentNode) {
        const bodyEl = new BodyElement('');
        bodyEl.sourceMap = sourceMap;
        return [utils.nextNode(node), bodyEl];
      }

      const body = bodyContentNode.literal || '';
      const bodyEl = new BodyElement(body);

      if (bodyContentNode.type !== 'code_block') {
        context.addWarning('"Body" is expected to be a pre-formatted code block, every of its line indented by exactly 12 spaces or 3 tabs', sourceMap);
      }
      bodyEl.sourceMap = sourceMap;
      return [utils.nextNode(node), bodyEl];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (bodyRegex.exec(text)) {
          return SectionTypes.body;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    allowLeavingNode: false,
  });
  return true;
};
