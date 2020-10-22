const utils = require('../utils');
const SectionTypes = require('../SectionTypes');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const { parser: SignatureParser, traits: ParserTraits, typeAttributes } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ArrayMemberParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      context.pushFrame();

      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      let signature;
      try {
        signature = new SignatureParser(subject, [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
      } catch (e) {
        if (!(e instanceof utils.SignatureError)) throw e;
      }

      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.attributeSignatureDetails = { sourceMap, node: node.firstChild };

      const description = signature.description
        ? utils.makeStringElement(signature.description, signature.descriptionOffset, node.firstChild, context)
        : null;

      const result = new ValueMemberElement(
        signature.type,
        signature.typeAttributes,
        signature.value,
        description,
        signature.isSample,
      );
      try {
        ValueMemberProcessor.fillBaseType(context, result);
      } catch (error) {
        if (!error.sourceMap) {
          error.sourceMap = sourceMap;
        }
        throw error;
      }

      result.sourceMap = sourceMap;

      const nestedNode = node.firstChild.next;

      if (nestedNode) {
        const dataStructureProcessor = new DataStructureProcessor(nestedNode, Parsers);
        dataStructureProcessor.fillValueMember(result, context);
      }

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
          if (signature.value || signature.rawValue || signature.type) {
            return SectionTypes.arrayMember;
          }
        } catch (e) {
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

    finalize(context, result) {
      const { attributeSignatureDetails } = context.data;
      context.popFrame();

      utils.validateAttributesConsistency(context, result, attributeSignatureDetails, typeAttributes);

      return result;
    },
  });
  return true;
};
