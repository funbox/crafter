const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const DataStructureGroupElement = require('./elements/DataStructureGroupElement');

const DataStructureGroupRegex = /^[Dd]ata\s+[Ss]tructures?$/;

module.exports = (Parsers) => {
  Parsers.DataStructureGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node) {
      return [utils.nextNode(node), new DataStructureGroupElement()];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (DataStructureGroupRegex.exec(subject)) {
          return SectionTypes.dataStructureGroup;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.MSONNamedTypeParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceGroupParser,
        Parsers.ResourcePrototypeParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.MSONNamedTypeParser.parse(node, context);
      result.dataStructures.push(childResult);
      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
