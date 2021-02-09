const SectionTypes = require('../SectionTypes');
const utilsHelpers = require('../utils/index');
const MSONMixinElement = require('./elements/MSONMixinElement');

const MSONMixinRegex = /^[Ii]nclude\s+(.+)$/;

module.exports = (Parsers) => {
  Parsers.MSONMixinParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);

      const sourceMap = utilsHelpers.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utilsHelpers.nextNode(node), new MSONMixinElement(MSONMixinRegex.exec(text)[1].trim(), sourceMap)];
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);

        if (MSONMixinRegex.exec(text)) {
          return SectionTypes.msonMixin;
        }
      }

      return SectionTypes.undefined;
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
