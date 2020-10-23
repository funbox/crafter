const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const DataStructureGroupElement = require('./elements/DataStructureGroupElement');

const DataStructureGroupRegex = /^[Dd]ata\s+[Ss]tructures?$/;

module.exports = (Parsers) => {
  Parsers.DataStructureGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utils.nextNode(node), new DataStructureGroupElement(sourceMap)];
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
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.MSONNamedTypeParser.parse(node, context);
      result.dataStructures.push(childResult);
      result.sourceMap = utils.mergeSourceMaps([result.sourceMap, childResult.sourceMap], context.sourceBuffer, context.linefeedOffsets);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
  return true;
};
