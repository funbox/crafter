const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const DataStructureGroupRegex = /^[Dd]ata\s+[Ss]tructures?$/;

module.exports = (Parsers) => {
  Parsers.DataStructureGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      result.element = Refract.elements.category;
      result.meta = {
        classes: [Refract.categoryClasses.dataStructures],
      };

      return utils.nextNode(node);
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
      return Parsers.MSONNamedTypeParser.sectionType(node, context);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.MSONNamedTypeParser.parse(node, context);
      result.content.push(childResult);
      return nextNode;
    }
  });
};