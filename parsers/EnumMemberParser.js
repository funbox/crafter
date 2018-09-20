const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const EnumMemberElement = require('./elements/EnumMemberElement');

const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.EnumMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(subject, [ParserTraits.EXAMPLE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);

      const result = new EnumMemberElement(
        signature.example,
        signature.description,
        signature.type,
      );

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, [ParserTraits.EXAMPLE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
          if (signature.example) {
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
  });
};
