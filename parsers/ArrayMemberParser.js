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

      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
      context.data.attributeSignatureDetails = { sourceMapBlocks: charBlocks, file: sourceMap.file };

      const result = new ValueMemberElement(
        signature.type,
        signature.typeAttributes,
        signature.value,
        signature.description,
        signature.isSample,
      );
      ValueMemberProcessor.fillBaseType(context, result);

      if (context.sourceMapsEnabled) {
        result.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      }

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

      if (result.isArray() && result.typeAttributes.includes(typeAttributes['fixed-type'])) {
        context.addWarning('fixed-type keyword is redundant', attributeSignatureDetails.sourceMapBlocks, attributeSignatureDetails.file);
        result.typeAttributes = result.typeAttributes.filter(x => x !== typeAttributes['fixed-type']);
      }

      const stringParameterizedAttributes = result.typeAttributes
        .filter(a => Array.isArray(a) && (a[0] === 'format' || a[0] === 'pattern'))
        .map(a => a[0]);

      if (!result.isType('string') && stringParameterizedAttributes.length > 0) {
        stringParameterizedAttributes.forEach(a => {
          context.addWarning(`Attribute "${a}" can be used in string value type only.`, attributeSignatureDetails.sourceMapBlocks, attributeSignatureDetails.file);
        });
      }

      return result;
    },
  });
  return true;
};
