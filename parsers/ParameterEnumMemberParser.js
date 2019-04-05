const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ParameterEnumMemberElement = require('./elements/ParameterEnumMemberElement');

const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ParameterEnumMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
      const signature = new SignatureParser(subject, [ParserTraits.VALUE, ParserTraits.DESCRIPTION]);
      signature.warnings.forEach(warning => context.addWarning(warning, charBlocks, sourceMap.file));

      const result = new ParameterEnumMemberElement(signature.value, signature.description);
      if (context.sourceMapsEnabled) {
        result.sourceMap = sourceMap;
      }

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, [ParserTraits.VALUE, ParserTraits.DESCRIPTION]);
          if (signature.value) {
            return SectionTypes.enumMember;
          }
        } catch (e) { // eslint-disable-line no-empty
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
