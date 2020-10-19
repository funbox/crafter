const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SchemaStructureGroupElement = require('./elements/SchemaStructureGroupElement');

const SchemaStructureGroupRegex = /^[Ss]chema\s+[Ss]tructures?$/;

module.exports = (Parsers) => {
  Parsers.SchemaStructureGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utils.nextNode(node), new SchemaStructureGroupElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines)[0];

        if (SchemaStructureGroupRegex.exec(subject)) {
          return SectionTypes.schemaStructureGroup;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.SchemaNamedTypeParser.sectionType(node, context);
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
      const [nextNode, childResult] = Parsers.SchemaNamedTypeParser.parse(node, context);
      result.schemaStructures.push(childResult);
      result.sourceMap = utils.mergeSourceMaps([result.sourceMap, childResult.sourceMap], context.sourceBuffer, context.linefeedOffsets);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
  return true;
};
