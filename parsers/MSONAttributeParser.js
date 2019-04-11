const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const PropertyMemberElement = require('./elements/PropertyMemberElement');
const StringElement = require('./elements/StringElement');
const SourceMapElement = require('./elements/SourceMapElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberElement = require('./elements/ValueMemberElement');
const ValueMemberProcessor = require('../ValueMemberProcessor');
const { parser: SignatureParser, typeAttributes } = require('../SignatureParser');

const valueAttributes = ['pattern', 'format', 'minLength', 'maxLength'];

module.exports = (Parsers) => {
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const subject = utils.nodeText(node.firstChild, context.sourceLines); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(subject);

      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
      context.data.attributeSignatureDetails = { sourceMapBlocks: charBlocks, file: sourceMap.file };

      signature.warnings.forEach(warning => context.addWarning(warning, charBlocks, sourceMap.file));

      const name = new StringElement(signature.name);
      let descriptionEl;
      if (signature.description) {
        descriptionEl = new StringElement(signature.description);
      }

      const propertyTypeAttributes = [];
      const valueTypeAttributes = [];

      signature.typeAttributes.forEach((attr) => {
        if (Array.isArray(attr) && valueAttributes.includes(attr[0])) {
          valueTypeAttributes.push(attr);
        } else {
          propertyTypeAttributes.push(attr);
        }
      });

      const valueEl = new ValueMemberElement(signature.type, valueTypeAttributes, signature.value, '', signature.isSample, signature.isDefault);
      ValueMemberProcessor.fillBaseType(context, valueEl);
      if (context.sourceMapsEnabled) {
        name.sourceMap = sourceMap;
        valueEl.sourceMap = sourceMap;
        if (descriptionEl) {
          descriptionEl.sourceMap = utils.makeSourceMapForLine(node.firstChild, context.sourceLines);
        }
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
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(contentNode, context, result) {
      const parentNode = contentNode && contentNode.parent;
      const type = result.value.type || types.object;
      const { startOffset } = context.data;

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
        ] = utils.extractDescription(contentNode, context.sourceLines, context.sourceMapsEnabled, stopCallback, startOffset);

        delete contentNode.skipLines;

        if (blockDescriptionEl) {
          const stringDescriptionEl = new StringElement(blockDescriptionEl.description, blockDescriptionEl.sourceMap);
          if (result.descriptionEl) {
            result.descriptionEl.string = utils.appendDescriptionDelimiter(result.descriptionEl.string);
            result.descriptionEl = mergeStringElements(result.descriptionEl, stringDescriptionEl);
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
        dataStructureProcessor.fillValueMember(result.value, context);
      }

      return [utils.nextNode(context.rootNode), result];
    },

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { name, value: { type, content } } = result;
      const { attributeSignatureDetails: details } = context.data;

      if (type === types.enum && !(content && content.members && content.members.length > 0)) {
        context.addWarning(`Enum element "${name.string}" should include members.`, details.sourceMapBlocks, details.file);
      }

      context.checkTypeExists(result.value.rawType);
      context.popFrame();

      if (result.value.isArray() && result.typeAttributes.includes(typeAttributes['fixed-type'])) {
        context.addWarning('fixed-type keyword is redundant', details.sourceMapBlocks, details.file);
        result.typeAttributes = result.typeAttributes.filter(x => x !== typeAttributes['fixed-type']);
      }

      const stringParameterizedAttributes = result.value.typeAttributes
        .filter(a => Array.isArray(a) && (a[0] === 'format' || a[0] === 'pattern'))
        .map(a => a[0]);

      if (!result.value.isType('string') && stringParameterizedAttributes.length > 0) {
        stringParameterizedAttributes.forEach(a => {
          context.addWarning(`Attribute "${a}" can be used in string value type only.`, details.sourceMapBlocks, details.file);
        });
      }

      return result;
    },
  });
  return true;
};

function mergeStringElements(first, second) {
  const merged = new StringElement();
  merged.string = first.string + second.string;
  if (first.sourceMap && second.sourceMap) {
    merged.sourceMap = new SourceMapElement();
    merged.sourceMap.blocks = [...first.sourceMap.blocks, ...second.sourceMap.blocks];
  }
  return merged;
}
