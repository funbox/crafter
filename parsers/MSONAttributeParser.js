const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const PropertyMemberElement = require('./elements/PropertyMemberElement');
const StringElement = require('./elements/StringElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const { parser: SignatureParser, typeAttributes } = require('../SignatureParser');

const valueAttributes = ['pattern', 'format', 'minLength', 'maxLength', 'minimum', 'maximum'];

module.exports = (Parsers) => {
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const subject = utils.nodeText(node.firstChild, context.sourceLines); // TODO: часто берем text, может сделать отдельную функцию?
      let signature;
      try {
        signature = new SignatureParser(subject);
      } catch (e) {
        if (!(e instanceof utils.SignatureError)) throw e;
      }

      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.attributeSignatureDetails = { sourceMap, node: node.firstChild };

      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      const name = new StringElement(signature.name);
      let descriptionEl;
      if (signature.description) {
        descriptionEl = new StringElement(signature.description);
      }

      const [propertyTypeAttributes, valueTypeAttributes] = splitTypeAttributes(signature.typeAttributes);

      const valueEl = new ValueMemberElement(signature.type, valueTypeAttributes, signature.value, '', signature.isSample, signature.isDefault);
      valueEl.sourceMap = sourceMap;
      const backPropagatedTypeAttributes = ValueMemberProcessor.fillBaseType(context, valueEl, true);
      const [propagatedTypeAttributes] = splitTypeAttributes(backPropagatedTypeAttributes);
      propertyTypeAttributes.push(...propagatedTypeAttributes.filter(attr => !propertyTypeAttributes.includes(attr)));

      name.sourceMap = sourceMap;
      if (descriptionEl) {
        descriptionEl.sourceMap = utils.makeSourceMapForLine(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      }

      if (signature.rest) {
        context.data.startOffset = subject.length - signature.rest.length;
      }

      const result = new PropertyMemberElement(
        name,
        valueEl,
        propertyTypeAttributes,
        descriptionEl,
      );

      const nextChildNode = signature.rest ? node.firstChild : node.firstChild.next;
      const nextNode = nextChildNode || utils.nextNode(context.rootNode);

      return [nextNode, result];
    },

    sectionType(node, context) {
      if (node && node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          new SignatureParser(text); // eslint-disable-line no-new
          return SectionTypes.msonAttribute;
        } catch (e) {
          if (!(e instanceof utils.SignatureError)) {
            throw e;
          } else {
            const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
          // В данном случае контейнером для описания является StringElement, а не DescriptionElement,
          // поскольку это описание попадает в поле `meta.description` инстанса PropertyMemberElement.
          // По спецификации это поле должно быть инстансом StringElement
          // https://apielements.org/en/latest/element-definitions.html#reserved-meta-properties
          const stringDescriptionEl = new StringElement(blockDescriptionEl.description, blockDescriptionEl.sourceMap);
          if (result.descriptionEl) {
            result.descriptionEl.string = utils.appendDescriptionDelimiter(result.descriptionEl.string);
            result.descriptionEl = utils.mergeStringElements(result.descriptionEl, stringDescriptionEl);
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
        const isFixedOrFixedType = result.typeAttributes.includes('fixed') || result.typeAttributes.includes('fixedType');
        context.data.isParentAttributeFixedOrFixedType = context.data.isParentAttributeFixedOrFixedType || isFixedOrFixedType;
        dataStructureProcessor.fillValueMember(result.value, context);
        delete context.data.isParentAttributeFixedOrFixedType;
      }

      return [utils.nextNode(context.rootNode), result];
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

      context.checkTypeExists(result.value.rawType);
      context.popFrame();

      utils.validateAttributesConsistency(context, result.value, details, typeAttributes);

      return result;
    },
  });
  return true;
};

function splitTypeAttributes(typeAttrs) {
  const propertyTypeAttributes = [];
  const valueTypeAttributes = [];

  typeAttrs.forEach((attr) => {
    if (Array.isArray(attr) && valueAttributes.includes(attr[0])) {
      valueTypeAttributes.push(attr);
    } else {
      propertyTypeAttributes.push(attr);
    }
  });
  return [propertyTypeAttributes, valueTypeAttributes];
}
