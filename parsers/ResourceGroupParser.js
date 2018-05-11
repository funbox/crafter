const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');
const ResourceParser = require('./ResourceParser');

const GroupHeaderRegex = new RegExp(`^[Gg]roup\\s+${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = {
  parse(node, context) {
    const matchData = GroupHeaderRegex.exec(utils.headerText(node, context.sourceLines));

    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [Refract.categoryClasses.resourceGroup],
        title: matchData[1]
      },
      content: [],
    };

    let curNode = node.next;

    [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

    if (description) {
      result.content.push({
        element: Refract.elements.copy,
        content: description,
      });
    }

    let childResult;

    while (curNode && ResourceParser.sectionType(curNode, context) !== SectionTypes.undefined) {
      [curNode, childResult] = ResourceParser.parse(curNode, context);
      result.content.push(childResult);
    }

    return [curNode, result];
  },
  sectionType(node, context) {
    if (node.type === 'heading') {
      const subject = utils.headerText(node, context.sourceLines);

      if (GroupHeaderRegex.exec(subject))
        return SectionTypes.resourceGroup;
    }

    return SectionTypes.undefined;
  }
};