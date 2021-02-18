const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { types } = require('../constants');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const AttributesElement = require('./elements/AttributesElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const StringElement = require('./elements/StringElement');

const attributesRegex = /^[Aa]ttributes?$/;
const { CrafterError, SignatureError } = utils;

module.exports = (Parsers) => {
  Parsers.AttributesParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeSourceMapForLine(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      let signature;
      try {
        signature = new SignatureParser(text, context.languageServerMode, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
      } catch (e) {
        if (!(e instanceof utils.SignatureError)) {
          throw e;
        } else {
          const message = 'Invalid Attributes signature. Expected format: "Attributes (Type Definition)".';
          throw new CrafterError(message, sourceMap);
        }
      }
      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      context.data.attributeSignatureDetails = { sourceMap, node: node.firstChild };

      if (signature.rest) {
        context.data.startOffset = text.length - signature.rest.length;
      }

      const resolvedType = utils.resolveType(signature.type);
      const nestedTypes = resolvedType.nestedTypes.map((nestedType, index) => {
        const el = new ValueMemberElement(nestedType, nestedType, []);
        el.sourceMap = utils.makeSourceMapsForString(
          nestedType,
          resolvedType.nestedTypesOffsets[index] + signature.typeOffset,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        );
        return el;
      });
      const memberEl = new ValueMemberElement(
        signature.type,
        resolvedType.type,
        nestedTypes,
        signature.typeAttributes,
      );

      const valueMemberSourceMaps = [];

      signature.typeAttributes.forEach((attr, index) => {
        const [offset, length] = signature.typeAttributesOffsetsAndLengths[index];

        valueMemberSourceMaps.push(utils.makeSourceMapsForStartPosAndLength(
          offset,
          length,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      });

      if (signature.type) {
        valueMemberSourceMaps.push(utils.makeSourceMapsForString(
          signature.type,
          signature.typeOffset,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      }

      valueMemberSourceMaps.sort((sm1, sm2) => sm1.byteBlocks[0].offset - sm2.byteBlocks[0].offset);

      if (valueMemberSourceMaps.length) {
        memberEl.sourceMap = utils.concatSourceMaps(valueMemberSourceMaps);
      }

      try {
        ValueMemberProcessor.fillBaseType(context, memberEl);
      } catch (error) {
        if (!error.sourceMap) {
          error.sourceMap = sourceMap;
        }
        throw error;
      }

      let nextNode = signature.rest ? node.firstChild : node.firstChild.next;

      if (!nextNode) {
        nextNode = utils.nextNode(node.firstChild);
      }

      const attributesSourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [nextNode, new AttributesElement(memberEl, attributesSourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, false);
          if (attributesRegex.exec(signature.name)) {
            return SectionTypes.attributes;
          }
        } catch (e) {
          if (!(e instanceof SignatureError)) throw e;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(contentNode, context, result) {
      const parentNode = contentNode && contentNode.parent;
      let type = result.content.type || types.object;
      const { startOffset } = context.data;
      const allowedContentSections = [
        Parsers.DefaultValueParser,
        Parsers.SampleValueParser,
        Parsers.MSONMemberGroupParser,
      ];
      const isContentSection = (node) => SectionTypes.calculateSectionType(node, context, allowedContentSections) !== SectionTypes.undefined;

      if (context.typeResolver.types[type]) {
        type = context.typeResolver.types[type].type || types.object;
      }

      let dataStructureProcessorStartNode = contentNode;

      if (contentNode) {
        let stopCallback = null;
        if (contentNode.type === 'paragraph' || !!startOffset) {
          stopCallback = curNode => (
            !utils.isCurrentNodeOrChild(curNode, parentNode)
            || isContentSection(curNode)
          );
        }
        contentNode.skipLines = startOffset ? 1 : 0;
        const [
          nextNode,
          blockDescriptionEl,
        ] = utils.extractDescription(contentNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback, startOffset);

        delete contentNode.skipLines;

        if (blockDescriptionEl) {
          result.content.description = new StringElement(blockDescriptionEl.description, blockDescriptionEl.sourceMap);
          result.content.sourceMap = result.content.sourceMap
            ? utils.concatSourceMaps([result.content.sourceMap, blockDescriptionEl.sourceMap])
            : blockDescriptionEl.sourceMap;
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
        const isFixedOrFixedType = result.content.typeAttributes.includes('fixed') || result.content.typeAttributes.includes('fixedType');
        const isFixedOrFixedTypePropagated = result.content.propagatedTypeAttributes
          && (result.content.propagatedTypeAttributes.includes('fixed') || result.content.propagatedTypeAttributes.includes('fixedType'));
        context.data.isParentAttributeFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedType || isFixedOrFixedTypePropagated;
        dataStructureProcessor.fillValueMember(result.content, context);
        delete context.data.isParentAttributeFixedOrFixedType;
      } else {
        // TODO: Что делать в этом случае?
      }

      if (!context.languageServerMode) {
        context.typeResolver.checkUsedMixins(result.content);
      }

      return [utils.nextNode(context.rootNode), result];
    },

    finalize(context, result) {
      const { attributeSignatureDetails } = context.data;

      context.popFrame();

      utils.validateAttributesConsistency(context, result.content, attributeSignatureDetails);

      return result;
    },
  });
  return true;
};
