const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const OneOfTypeOptionElement = require('./elements/OneOfTypeOptionElement');

const oneOfTypeOptionRegex = /^[Pp]roperties$/;

module.exports = (Parsers) => {
  Parsers.OneOfTypeOptionParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const optionMembersList = node.firstChild.next;
      const nextNode = (optionMembersList && optionMembersList.firstChild) || utils.nextNode(node);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [nextNode, new OneOfTypeOptionElement([], sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (oneOfTypeOptionRegex.exec(text)) {
          return SectionTypes.oneOfTypeOption;
        }
      }
      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      if (node.parent.parent && this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return Parsers.MSONAttributeParser.sectionType(node, context);
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      if (!node) {
        return [node, result];
      }

      const [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
      result.members.push(childResult);

      return [nextNode, result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
