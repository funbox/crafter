const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const PropertyMemberElement = require('./elements/PropertyMemberElement');
const StringElement = require('./elements/StringElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const { parser: SignatureParser } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const subject = utilsHelpers.nodeText(node.firstChild, context.sourceLines); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(subject, context.languageServerMode);

      const sourceMap = utilsHelpers.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.attributeSignatureDetails = { sourceMap, node: node.firstChild };

      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      const name = signature.name
        ? utilsHelpers.makeStringElement(signature.name, signature.nameOffset, node.firstChild, context)
        : new StringElement(signature.name);
      let descriptionEl;
      if (signature.description) {
        descriptionEl = utilsHelpers.makeStringElement(signature.description, signature.descriptionOffset, node.firstChild, context);
      }

      const splitAttributes = utilsHelpers.splitTypeAttributes(signature.typeAttributes);
      const propertyTypeAttributes = splitAttributes[0];
      const valueTypeAttributes = splitAttributes[1];
      const valueTypeAttributesIndexes = splitAttributes[3];

      const valueMemberSourceMaps = [];

      if (signature.value) {
        valueMemberSourceMaps.push(utilsHelpers.makeSourceMapsForString(
          signature.value,
          signature.valueOffset,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      }

      valueTypeAttributes.forEach((attr, index) => {
        const origIndex = valueTypeAttributesIndexes[index];
        const [offset, length] = signature.typeAttributesOffsetsAndLengths[origIndex];

        valueMemberSourceMaps.push(utilsHelpers.makeSourceMapsForStartPosAndLength(
          offset,
          length,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      });

      if (signature.type) {
        valueMemberSourceMaps.push(utilsHelpers.makeSourceMapsForString(
          signature.type,
          signature.typeOffset,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        ));
      }

      valueMemberSourceMaps.sort((sm1, sm2) => sm1.byteBlocks[0].offset - sm2.byteBlocks[0].offset);

      const resolvedType = utilsHelpers.resolveType(signature.type);
      const nestedTypes = resolvedType.nestedTypes.map((nestedType, index) => {
        const el = new ValueMemberElement(nestedType, nestedType, []);
        el.sourceMap = utilsHelpers.makeSourceMapsForString(
          nestedType,
          resolvedType.nestedTypesOffsets[index] + signature.typeOffset,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        );
        return el;
      });
      const valueEl = new ValueMemberElement(
        signature.type,
        resolvedType.type,
        nestedTypes,
        valueTypeAttributes,
        signature.value,
        null,
        signature.isSample,
        signature.isDefault,
      );

      if (valueMemberSourceMaps.length) {
        valueEl.sourceMap = utilsHelpers.concatSourceMaps(valueMemberSourceMaps);
      }

      try {
        ValueMemberProcessor.fillBaseType(context, valueEl, true);
      } catch (error) {
        if (!error.sourceMap) {
          error.sourceMap = sourceMap;
        }
        throw error;
      }

      if (signature.rest) {
        context.data.startOffset = subject.length - signature.rest.length;
      }

      const result = new PropertyMemberElement(
        name,
        valueEl,
        propertyTypeAttributes,
        descriptionEl,
        utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets),
      );

      const nextChildNode = signature.rest ? node.firstChild : node.firstChild.next;
      const nextNode = nextChildNode || utilsHelpers.nextNode(context.rootNode);

      return [nextNode, result];
    },

    sectionType(node, context) {
      if (node && node.type === 'item' && node.firstChild) {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);

        try {
          new SignatureParser(text, context.languageServerMode); // eslint-disable-line no-new
          return SectionTypes.msonAttribute;
        } catch (e) {
          if (!(e instanceof utils.SignatureError)) {
            throw e;
          } else {
            const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
            throw new utils.CrafterError(e.message, sourceMap);
          }
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(contentNode, context, result) {
      const parentNode = contentNode && contentNode.parent;
      const { startOffset } = context.data;
      const allowedContentSections = [
        Parsers.DefaultValueParser,
        Parsers.SampleValueParser,
        Parsers.MSONMemberGroupParser,
      ];
      const isContentSection = (node) => SectionTypes.calculateSectionType(node, context, allowedContentSections) !== SectionTypes.undefined;

      let dataStructureProcessorStartNode = contentNode;

      if (contentNode) {
        let stopCallback = null;
        if (contentNode.type === 'paragraph' || !!startOffset) {
          stopCallback = curNode => (
            !utilsHelpers.isCurrentNodeOrChild(curNode, parentNode)
            || isContentSection(curNode)
          );
        }
        contentNode.skipLines = startOffset ? 1 : 0;
        const [
          nextNode,
          blockDescriptionEl,
        ] = utilsHelpers.extractDescription(contentNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback, startOffset);

        delete contentNode.skipLines;

        if (blockDescriptionEl) {
          // В данном случае контейнером для описания является StringElement, а не DescriptionElement,
          // поскольку это описание попадает в поле `meta.description` инстанса PropertyMemberElement.
          // По спецификации это поле должно быть инстансом StringElement
          // https://apielements.org/en/latest/element-definitions.html#reserved-meta-properties
          const stringDescriptionEl = new StringElement(blockDescriptionEl.description, blockDescriptionEl.sourceMap);
          if (result.descriptionEl) {
            result.descriptionEl.string = utilsHelpers.appendDescriptionDelimiter(result.descriptionEl.string);
            result.descriptionEl = utilsHelpers.mergeStringElements(result.descriptionEl, stringDescriptionEl);
          } else {
            result.descriptionEl = stringDescriptionEl;
          }
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
        const isFixedOrFixedType = result.value.typeAttributes.includes('fixed') || result.value.typeAttributes.includes('fixedType');
        const isFixedOrFixedTypePropagated = result.value.propagatedTypeAttributes
          && (result.value.propagatedTypeAttributes.includes('fixed') || result.value.propagatedTypeAttributes.includes('fixedType'));
        context.data.isParentAttributeFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedType || isFixedOrFixedTypePropagated;
        dataStructureProcessor.fillValueMember(result.value, context);
        delete context.data.isParentAttributeFixedOrFixedType;
      }

      return [utilsHelpers.nextNode(context.rootNode), result];
    },

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { name, value: { type, content, value } } = result;
      const { attributeSignatureDetails: details } = context.data;

      if (result.value.isObject() && content && value != null) {
        context.addWarning('"object" with value definition. You should use type definition without value, e.g., "+ key (object)"', details.sourceMap);
      }

      if (type === types.enum && !(content && content.members && content.members.length > 0)) {
        context.addWarning(`Enum element "${name.string}" should include members.`, details.sourceMap);
      }

      context.popFrame();

      utilsHelpers.validateAttributesConsistency(context, result.value, details);

      return result;
    },
  });
  return true;
};
