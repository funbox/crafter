const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const ParameterEnumMemberElement = require('./elements/ParameterEnumMemberElement');

const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ParameterEnumMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const signature = new SignatureParser(subject, false, [ParserTraits.VALUE, ParserTraits.DESCRIPTION]);
      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      const result = new ParameterEnumMemberElement(signature.value, signature.description);
      result.sourceMap = sourceMap;

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, false, [ParserTraits.VALUE, ParserTraits.DESCRIPTION]);
          if (signature.value) {
            return SectionTypes.enumMember;
          }
        } catch (e) { // eslint-disable-line no-empty
          if (!(e instanceof utils.SignatureError)) throw e;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
