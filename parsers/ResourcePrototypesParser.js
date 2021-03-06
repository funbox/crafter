const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ResourcePrototypesElement = require('./elements/ResourcePrototypesElement');

const ResourcePrototypesRegex = /^[Rr]esource\s+[Pp]rototypes$/;

module.exports = (Parsers) => {
  Parsers.ResourcePrototypesParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
      return [utils.nextNode(node), new ResourcePrototypesElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

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
        Parsers.ImportParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResourcePrototypeParser.parse(node, context);
      result.resourcePrototypes.push(childResult);
      result.sourceMap = utils.concatSourceMaps([result.sourceMap, childResult.sourceMap]);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    finalize(context, result) {
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);
      result.sourceMap = utils.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps]);

      return result;
    },
  });
  return true;
};
