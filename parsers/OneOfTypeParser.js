const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const OneOfTypeElement = require('./elements/OneOfTypeElement');
const OneOfTypeOptionElement = require('./elements/OneOfTypeOptionElement');

const oneOfTypeRegex = /^[Oo]ne\s+[Oo]f$/;

module.exports = (Parsers) => {
  Parsers.OneOfTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const optionsList = node.firstChild.next;
      const nextNode = (optionsList && optionsList.firstChild) || utils.nextNode(node);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [nextNode, new OneOfTypeElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node && node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
        if (oneOfTypeRegex.exec(text)) {
          return SectionTypes.oneOfType;
        }
      }
      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      if (node.type === 'item' && this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return SectionTypes.calculateSectionType(node, context, [
          Parsers.OneOfTypeOptionParser,
          Parsers.MSONAttributeParser,
        ]);
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      const nodeType = this.nestedSectionType(node, context);

      switch (nodeType) {
        case SectionTypes.oneOfTypeOption:
          [nextNode, childResult] = Parsers.OneOfTypeOptionParser.parse(node, context);
          result.options.push(childResult);
          break;
        case SectionTypes.msonAttribute: {
          const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
          result.options.push(new OneOfTypeOptionElement([childResult], sourceMap));
          break;
        }
        default:
          break;
      }
      return [nextNode, result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
