const utils = require('../utils');
const ValueMemberElement = require('./elements/ValueMemberElement');
const DataStructureProcessor = require('./DataStructureProcessor');
const {parser: SignatureParser, traits: ParserTraits} = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ArrayMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(subject, [ParserTraits.EXAMPLE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);

      const result = new ValueMemberElement(
        signature.type,
        signature.typeAttributes,
        signature.example,
        signature.description,
      );

      const nestedNode = node.firstChild.next;

      if (nestedNode) {
        const dataStructureProcessor = new DataStructureProcessor(nestedNode, Parsers);
        dataStructureProcessor.fillValueMember(result, context);
      }

      return [utils.nextNode(node), result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
