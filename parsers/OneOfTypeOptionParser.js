const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const OneOfTypeOptionElement = require('./elements/OneOfTypeOptionElement');

const oneOfTypeOptionRegex = /^[Pp]roperties$/;

module.exports = (Parsers) => {
  Parsers.OneOfTypeOptionParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node) {
      const optionMembersList = node.firstChild.next;
      const nextNode = (optionMembersList && optionMembersList.firstChild) || utils.nextNode(node);
      return [nextNode, new OneOfTypeOptionElement()];
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
      if (this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return Parsers.MSONAttributeParser.sectionType(node, context);
      }

      return SectionTypes.undefined;
    },

    processNestedSection(node, context, result) {
      if (!node) {
        return [node, result];
      }

      const [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
      result.members.push(childResult);

      return [nextNode, result];
    },
  });
};
