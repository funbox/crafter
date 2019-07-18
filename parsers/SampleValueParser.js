const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SampleValueElement = require('./elements/SampleValueElement');
const { splitValues } = require('../SignatureParser');
const StringElement = require('./elements/StringElement');

const sampleValueRegex = /^[Ss]ample:?\s*`?(.+?)`?$/;
const listTypedSampleValueRegex = /^[Ss]ample$/;

module.exports = (Parsers) => {
  Parsers.SampleValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const valuesMatch = sampleValueRegex.exec(text);
      const values = valuesMatch ? splitValues(valuesMatch[1]) : undefined;

      const result = [];

      if (values) {
        // TODO Сделать разные sourceMap на каждый StringElement
        const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

        switch (context.data.typeForSamples) {
          case 'primitive':
          case 'enum':
            values.forEach((value) => {
              const converted = utils.convertType(value, context.data.valueType);

              if (converted.valid) {
                result.push(new SampleValueElement(converted.value, context.data.valueType, sourceMap));
              }
            });
            break;
          case 'array': {
            const valueEls = values.map((value) => new StringElement(value, sourceMap));
            result.push(new SampleValueElement(valueEls));
            break;
          }

          // no default
        }
      }

      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (sampleValueRegex.exec(text) || listTypedSampleValueRegex.exec(text)) {
          return SectionTypes.sampleValue;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node) {
      if (node.type === 'item') {
        return SectionTypes.sampleValueMember;
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      switch (context.data.typeForSamples) {
        case 'primitive':
        case 'enum': {
          const converted = utils.convertType(text, context.data.valueType);

          if (converted.valid) {
            result.push(new SampleValueElement(converted.value, context.data.valueType, sourceMap));
          }
          break;
        }
        case 'array': {
          const converted = utils.convertType(text, context.data.valueType);

          if (converted.valid) {
            if (!result.length) {
              result.push(new SampleValueElement([], context.data.valueType, []));
            }
            const sample = result[result.length - 1];
            sample.value.push(converted.value);
            sample.sourceMap.push(sourceMap);
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
