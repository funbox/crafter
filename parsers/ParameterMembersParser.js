const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ParameterMembersElement = require('./elements/ParameterMembersElement');

const parameterMembersRegex = /^[Mm]embers$/;
const parameterMemberRegex = /^`?(.+?)`?$/;

module.exports = (Parsers) => {
  Parsers.ParameterMembersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node) {
      const nextNode = (node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node);
      return [nextNode, new ParameterMembersElement()];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
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
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      result.members.push(parameterMemberRegex.exec(text)[1]);

      return [utils.nextNode(node), result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
