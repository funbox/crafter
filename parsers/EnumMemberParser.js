const utils = require('../utils');
const EnumMemberElement = require('./elements/EnumMemberElement');

const SignatureParser = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.EnumMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(subject);

      const result = new EnumMemberElement(
        signature.name,
        signature.description,
        signature.type,
      );

      return [utils.nextNode(node), result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
