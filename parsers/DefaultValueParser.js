const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { splitValues } = require('../SignatureParser');
const DefaultValueElement = require('./elements/DefaultValueElement');

const defaultValueRegex = /^[Dd]efault:\s*`?(.+?)`?$/;
const listTypedDefaultValueRegex = /^[Dd]efault$/;

module.exports = (Parsers) => {
  Parsers.DefaultValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const valMatch = defaultValueRegex.exec(text);
      const values = valMatch ? splitValues(valMatch[1]) : undefined;
      const defaultValueElement = new DefaultValueElement(values);
      if (context.sourceMapsEnabled && values !== undefined) {
        defaultValueElement.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      }
      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), defaultValueElement];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (defaultValueRegex.exec(text) || listTypedDefaultValueRegex.exec(text)) {
          return SectionTypes.defaultValue;
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
      result.values = result.values || [];
      result.values.push(hasValue ? childResult : childResult.name);

      return [nextNode, result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
