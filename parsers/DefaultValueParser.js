const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const DefaultValueElement = require('./elements/DefaultValueElement');

const defaultValueRegex = /^[Dd]efault:\s*`?(.+?)`?$/;
const listTypedDefaultValueRegex = /^[Dd]efault$/;

module.exports = (Parsers) => {
  Parsers.DefaultValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const valMatch = defaultValueRegex.exec(text);
      const val = (valMatch && valMatch[1]) || undefined;
      const defaultValueElement = new DefaultValueElement(val);
      if (context.sourceMapsEnabled && val !== undefined) {
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
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const value = new SignatureParser(text, [ParserTraits.NAME, ParserTraits.DESCRIPTION]);
      value.warnings.forEach(warning => context.logger.warn(warning, utils.getDetailsForLogger(node.firstChild)));

      result.value = value.name;
      if (context.sourceMapsEnabled) {
        result.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      }

      return [utils.nextNode(node), result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
};
