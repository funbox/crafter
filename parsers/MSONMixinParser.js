const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const MSONMixinElement = require('./elements/MSONMixinElement');

const MSONMixinRegex = /^[Ii]nclude\s+(.+)$/;

module.exports = (Parsers) => {
  Parsers.MSONMixinParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);

      return [utils.nextNode(node), new MSONMixinElement(MSONMixinRegex.exec(text)[1].trim())];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        if (MSONMixinRegex.exec(text)) {
          return SectionTypes.msonMixin;
        }
      }

      return SectionTypes.undefined;
    },
  });
};
