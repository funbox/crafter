const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const GroupHeaderRegex = new RegExp(`^[Gg]roup\\s+${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      const matchData = GroupHeaderRegex.exec(utils.headerText(node, context.sourceLines));

      result.element = Refract.elements.category;
      result.meta = {
        classes: [Refract.categoryClasses.resourceGroup],
        title: matchData[1]
      };

      return utils.nextNode(node);
    },
    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (GroupHeaderRegex.exec(subject))
          return SectionTypes.resourceGroup;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResourceParser.sectionType(node, context);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResourceParser.parse(node, context);
      result.content.push(childResult);
      return nextNode;
    }
  });
};