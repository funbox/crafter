const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const SampleValueElement = require('./elements/SampleValueElement');
const { splitValues } = require('../SignatureParser');

const sampleValueRegex = /^[Ss]ample:\s*`?(.+?)`?$/;
const listTypedSampleValueRegex = /^[Ss]ample$/;

module.exports = (Parsers) => {
  Parsers.SampleValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const result = [];

      if (node.type === 'item') {
        processInlineSamples(node, context, result);
      }

      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
        if (sampleValueRegex.exec(text) || listTypedSampleValueRegex.exec(text)) {
          return SectionTypes.sampleValue;
        }
      }
      if (node.type === 'heading') {
        const text = utils.headerText(node, context.sourceLines);
        if (listTypedSampleValueRegex.exec(text)) {
          return SectionTypes.sampleValue;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node) {
      if (node.type === 'item' || node.type === 'paragraph') {
        return SectionTypes.sampleValueMember;
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      const textNode = node.type === 'item' ? node.firstChild : node;
      const text = utilsHelpers.nodeText(textNode, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(textNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      switch (context.data.typeForSamples) {
        case 'primitive':
        case 'enum': {
          const converted = utilsHelpers.convertType(text, context.data.valueType);

          if (converted.valid) {
            result.push(new SampleValueElement(converted.value, context.data.valueType, sourceMap));
          } else {
            context.addTypeMismatchWarning(text, context.data.valueType, sourceMap);
          }
          break;
        }
        case 'array': {
          const converted = utilsHelpers.convertType(text, context.data.valueType);

          if (converted.valid) {
            if (!result.length) {
              result.push(new SampleValueElement([], context.data.valueType, []));
            }
            const sample = result[result.length - 1];
            sample.value.push(converted.value);
            sample.sourceMap.push(sourceMap);
          } else {
            context.addTypeMismatchWarning(text, context.data.valueType, sourceMap);
          }

          break;
        }
        // no default
      }

      return [utils.nextNode(node), result];
    },

    isUnexpectedNode() {
      return false;
    },
    allowLeavingNode: false,
  });
  return true;
};

function processInlineSamples(node, context, result) {
  const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
  const valuesMatch = sampleValueRegex.exec(text);

  if (!valuesMatch) return;

  const values = splitValues(valuesMatch[1]);

  const sourceMaps = utils.makeSourceMapsForInlineValues(valuesMatch[1], values, node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

  switch (context.data.typeForSamples) {
    case 'primitive':
    case 'enum':
      values.forEach((value, index) => {
        const converted = utilsHelpers.convertType(value, context.data.valueType);

        if (converted.valid) {
          result.push(new SampleValueElement(converted.value, context.data.valueType, sourceMaps[index]));
        } else {
          context.addTypeMismatchWarning(value, context.data.valueType, sourceMaps[index]);
        }
      });
      break;
    case 'array': {
      const preparedValues = values.reduce((res, v, index) => {
        const converted = utilsHelpers.convertType(v, context.data.valueType);

        if (converted.valid) {
          res.push(converted.value);
        } else {
          context.addTypeMismatchWarning(v, context.data.valueType, sourceMaps[index]);
        }
        return res;
      }, []);
      result.push(new SampleValueElement(preparedValues, context.data.valueType, sourceMaps));
      break;
    }

    // no default
  }
}
