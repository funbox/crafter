const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const MemberGroupElement = require('./elements/MemberGroupElement');
const ValueMemberElement = require('./elements/ValueMemberElement');
const DataStructureProcessor = require('../DataStructureProcessor');
const ValueMemberProcessor = require('../ValueMemberProcessor');

const CrafterError = utils.CrafterError;

const separatorToRegexp = separator => new RegExp(`^${separator}$`, 'i');

const groupSeparator = {
  array: 'Items',
  enum: 'Members',
  object: 'Properties',
};

const sectionTypes = {
  array: SectionTypes.msonArrayMemberGroup,
  enum: SectionTypes.msonEnumMemberGroup,
  object: SectionTypes.msonObjectMemberGroup,
};

const memberSeparatorRegex = {
  array: separatorToRegexp(groupSeparator.array),
  enum: separatorToRegexp(groupSeparator.enum),
  object: separatorToRegexp(groupSeparator.object),
};

module.exports = (Parsers) => {
  Parsers.MSONMemberGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      let type;
      const { isNamedTypeSection } = context.data;
      const text = node.type === 'heading'
        ? utils.headerText(node, context.sourceLines)
        : utils.nodeText(node.firstChild, context.sourceLines);

      if (node.type !== 'heading' && isNamedTypeSection) {
        const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
        throw new CrafterError(`Expected header-defined member type group "${text}", e.g. "## <text>"`, sourceMap);
      }

      Object.keys(memberSeparatorRegex).forEach((key) => {
        if (memberSeparatorRegex[key].test(text)) {
          type = key;
        }
      });
      const nextNode = (node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node);
      return [nextNode, new MemberGroupElement(type)];
    },

    sectionType(node, context) {
      let sectionType = SectionTypes.undefined;

      if (node.type === 'list') node = node.firstChild;
      if (node.type === 'item' || node.type === 'heading') {
        const text = node.type === 'heading'
          ? utils.headerText(node, context.sourceLines)
          : utils.nodeText(node.firstChild, context.sourceLines);
        Object.keys(memberSeparatorRegex).forEach((key) => {
          if (memberSeparatorRegex[key].test(text)) {
            sectionType = sectionTypes[key];
          }
        });
      }

      return sectionType;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.EnumMemberParser,
        Parsers.ArrayMemberParser,
        Parsers.MSONAttributeParser,
      ]);
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      const { type } = result;

      const dataStructureProcessor = new DataStructureProcessor(node.parent, Parsers);
      const valueMember = new ValueMemberElement(type, type, context.data.parentNestedTypes);

      ValueMemberProcessor.fillBaseType(context, valueMember);
      dataStructureProcessor.fillValueMember(valueMember, context);
      result.childValueMember = valueMember;

      return [utils.nextNode(node.parent), result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
