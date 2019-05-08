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
      let valueEls;
      if (values) {
        const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
        valueEls = values.map((value) => {
          const el = new StringElement(value);
          el.sourceMap = sourceMap;
          return el;
        });
      }
      const sampleValueElement = new SampleValueElement(valueEls);
      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), sampleValueElement];
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

    nestedSectionType(node, context) {
      if (node.type === 'item' && this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return SectionTypes.msonAttribute;
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
      const hasValue = !!(childResult.value.content || childResult.value.value);
      result.values.push(hasValue ? childResult : childResult.name);

      return [nextNode, result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
