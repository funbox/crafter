const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const SubgroupElement = require('./elements/SubgroupElement');

const SubgroupHeaderRegex = new RegExp(`^[Ss]ub[Gg]roup(\\s+${RegExpStrings.symbolIdentifier})$`);

module.exports = (Parsers) => {
  Parsers.SubgroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [matchData, matchDataIndexes] = utils.matchStringToRegex(subject, SubgroupHeaderRegex);

      const titleString = matchData[1].trim();
      const title = utils.makeStringElement(
        titleString,
        subjectOffset + matchDataIndexes[1] + matchData[1].indexOf(titleString),
        node,
        context,
      );
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const result = new SubgroupElement(title, sourceMap);

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (SubgroupHeaderRegex.exec(subject)) {
          return SectionTypes.subGroup;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.MessageParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.SubgroupParser,
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.MessageParser.parse(node, context);

      result.messages.push(childResult);
      result.sourceMap = utils.concatSourceMaps([result.sourceMap, childResult.sourceMap]);
      return [nextNode, result];
    },

    finalize(context, result) {
      if (result.description) {
        result.sourceMap = utils.concatSourceMaps([result.sourceMap, result.description.sourceMap]);
      }
      return result;
    },
  });
  return true;
};
