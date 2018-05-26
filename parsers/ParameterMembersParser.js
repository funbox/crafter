const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const parameterMembersRegex = /^[Mm]embers$/;
const parameterMemberRegex = /^`?(.+?)`?$/;

module.exports = (Parsers) => {
  Parsers.ParameterMembersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      result.element = Refract.elements.array;
      result.content = [];

      return node.firstChild.next && node.firstChild.next.firstChild || utils.nextNode(node);
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
        if (parameterMembersRegex.exec(text)) {
          return SectionTypes.parameterMembers;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      if (node.type === 'item' && this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return SectionTypes.parameterMember;
      }

      return SectionTypes.undefined;
    },

    processNestedSection(node, context, result) {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
      result.content.push({
        element: Refract.elements.string,
        content: parameterMemberRegex.exec(text)[1],
      });

      return utils.nextNode(node);
    },

    processDescription(node) {
      return node;
    }
  });
};