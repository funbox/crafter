const utils = require('../utils');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const { parser: SignatureParser, traits: ParserTraits, typeAttributes } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ArrayMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      context.pushFrame();

      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(subject, [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);

      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.attributeSignatureDetails = { sourceMap };

      const result = new ValueMemberElement(
        signature.type,
        signature.typeAttributes,
        signature.value,
        signature.description,
        signature.isSample,
      );
      ValueMemberProcessor.fillBaseType(context, result);

      result.sourceMap = sourceMap;

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

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { attributeSignatureDetails } = context.data;
      context.popFrame();

      [context, result] = utils.validateAttributesConsistency(context, result, attributeSignatureDetails, typeAttributes);

      return result;
    },
  });
  return true;
};
