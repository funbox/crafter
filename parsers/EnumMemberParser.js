const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const EnumMemberElement = require('./elements/EnumMemberElement');

const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.EnumMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
      const signature = new SignatureParser(subject, [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
      signature.warnings.forEach(warning => context.addWarning(warning, charBlocks, sourceMap.file));

      const result = new EnumMemberElement(
        signature.value,
        signature.description,
        signature.type,
        signature.isSample,
      );

      result.sourceMap = sourceMap;

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
          if (signature.value || signature.rawValue) {
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
