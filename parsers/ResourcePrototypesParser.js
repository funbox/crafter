const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ResourcePrototypesElement = require('./elements/ResourcePrototypesElement');

const ResourcePrototypesRegex = /^[Rr]esource\s+[Pp]rototypes$/;

module.exports = (Parsers) => {
  Parsers.ResourcePrototypesParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utils.nextNode(node), new ResourcePrototypesElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines)[0];

        if (ResourcePrototypesRegex.exec(subject)) {
          return SectionTypes.resourcePrototypes;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResourcePrototypeParser.sectionType(node, context);
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
      const [nextNode, childResult] = Parsers.ResourcePrototypeParser.parse(node, context);
      result.resourcePrototypes.push(childResult);
      result.sourceMap = utils.mergeSourceMaps([result.sourceMap, childResult.sourceMap], context.sourceBuffer, context.linefeedOffsets);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
  return true;
};
