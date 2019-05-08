const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const types = require('../types');
const { parser: SignatureParser, traits: ParserTraits, typeAttributes } = require('../SignatureParser');
const AttributesElement = require('./elements/AttributesElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');

const attributesRegex = /^[Aa]ttributes?$/;
const { CrafterError } = utils;

module.exports = (Parsers) => {
  Parsers.AttributesParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeSourceMapForLine(node.firstChild, context.sourceLines);
      const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
      let signature;
      try {
        signature = new SignatureParser(text, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
      } catch (e) {
        const [line, file] = utils.getDetailsForLogger(node.firstChild);
        const message = 'Invalid Attributes signature. Expected format: "Attributes (Type Definition)".';
        throw new CrafterError(message, line, file);
      }
      signature.warnings.forEach(warning => context.addWarning(warning, charBlocks, sourceMap.file));

      context.data.attributeSignatureDetails = { sourceMapBlocks: charBlocks, file: sourceMap.file };

      if (signature.rest) {
        context.data.startOffset = text.length - signature.rest.length;
      }

      const memberEl = new ValueMemberElement(signature.type, signature.typeAttributes);
      ValueMemberProcessor.fillBaseType(context, memberEl);

      memberEl.sourceMap = sourceMap;
      let nextNode = signature.rest ? node.firstChild : node.firstChild.next;

      if (!nextNode) {
        nextNode = utils.nextNode(node.firstChild);
      }

      return [nextNode, new AttributesElement(memberEl)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (attributesRegex.exec(signature.name)) {
            return SectionTypes.attributes;
          }
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.MSONAttributeParser.sectionType(node, context);
    },

    processDescription(contentNode, context, result) {
      const parentNode = contentNode && contentNode.parent;
      let type = result.content.type || types.object;
      const { startOffset } = context.data;

      if (context.typeResolver.types[type]) {
        type = context.typeResolver.types[type].type || types.object;
      }

      let dataStructureProcessorStartNode = contentNode;

      if (contentNode) {
        let stopCallback = null;
        if (contentNode.type === 'paragraph' || !!startOffset) {
          stopCallback = curNode => (
            !utils.isCurrentNodeOrChild(curNode, parentNode)
            || Parsers.MSONMemberGroupParser.sectionType(curNode, context, type) !== SectionTypes.undefined
          );
        }
        contentNode.skipLines = startOffset ? 1 : 0;
        const [
          nextNode,
          blockDescriptionEl,
        ] = utils.extractDescription(contentNode, context.sourceLines, stopCallback, startOffset);

        delete contentNode.skipLines;

        if (blockDescriptionEl) {
          result.content.description = blockDescriptionEl.description;
          result.content.sourceMap.blocks.push(...blockDescriptionEl.sourceMap.blocks);
        }
        dataStructureProcessorStartNode = nextNode;
      }

      if (dataStructureProcessorStartNode !== contentNode) {
        context.data.descriptionExtracted = true;
      }
      return [dataStructureProcessorStartNode, result];
    },

    processNestedSections(node, context, result) {
      const nestedSectionsContentNode = context.data.descriptionExtracted ? (node && node.parent) : node;
      const startNode = context.data.descriptionExtracted ? node : undefined;

      if (nestedSectionsContentNode && nestedSectionsContentNode.type === 'list') {
        const dataStructureProcessor = new DataStructureProcessor(nestedSectionsContentNode, Parsers, startNode);
        dataStructureProcessor.fillValueMember(result.content, context);
      } else {
        // TODO: Что делать в этом случае?
      }

      context.typeResolver.checkUsedMixins(result.content);
      return [utils.nextNode(context.rootNode), result];
    },

    finalize(context, result) {
      const { attributeSignatureDetails } = context.data;

      context.popFrame();

      [context, result.content] = utils.validateAttributesConsistency(context, result.content, attributeSignatureDetails, typeAttributes);

      return result;
    },
  });
  return true;
};
