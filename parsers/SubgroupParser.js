const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const SubgroupElement = require('./elements/SubgroupElement');
const StringElement = require('./elements/StringElement');

const SubgroupHeaderRegex = new RegExp(`^[Ss]ub[Gg]roup(\\s+${RegExpStrings.symbolIdentifier})$`);

module.exports = (Parsers) => {
  Parsers.SubgroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const matchData = SubgroupHeaderRegex.exec(utils.headerText(node, context.sourceLines));
      const title = new StringElement(matchData[1].trim());
      title.sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const result = new SubgroupElement(title);

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

    nestedSectionType() {
      return SectionTypes.undefined;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.SubgroupParser,
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },
  });
  return true;
};
