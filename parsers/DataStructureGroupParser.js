const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const MSONNamedTypeParser = require('./MSONNamedTypeParser');

const DataStructureGroupRegex = /^[Dd]ata\s+[Ss]tructures?$/;

module.exports = {
  parse(node, context) {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [Refract.categoryClasses.dataStructures],
      },
      content: [],
    };

    let curNode = node.next;
    let childResult;

    while (curNode && MSONNamedTypeParser.sectionType(curNode, context) != SectionTypes.undefined) {
      [curNode, childResult] = MSONNamedTypeParser.parse(curNode, context);

      result.content.push(childResult);
    }

    return [curNode, result];
  },
  sectionType(node, context) {
    if (node.type === 'heading') {
      const subject = utils.headerText(node, context.sourceLines);

      if (DataStructureGroupRegex.exec(subject))
        return SectionTypes.dataStructureGroup;
    }

    return SectionTypes.undefined;
  }
};