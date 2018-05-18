const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const MSONNamedTypeParser = require('./MSONNamedTypeParser');

const DataStructureGroupRegex = /^[Dd]ata\s+[Ss]tructures?$/;

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    result.element = Refract.elements.category;
    result.meta = {
      classes: [Refract.categoryClasses.dataStructures],
    };

    return node.next;
  },

  sectionType(node, context) {
    if (node.type === 'heading') {
      const subject = utils.headerText(node, context.sourceLines);

      if (DataStructureGroupRegex.exec(subject))
        return SectionTypes.dataStructureGroup;
    }

    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) {
    return MSONNamedTypeParser.sectionType(node, context);
  },

  processNestedSection(node, context, result) {
    const [nextNode, childResult] = MSONNamedTypeParser.parse(node, context);
    result.content.push(childResult);
    return nextNode;
  }
});