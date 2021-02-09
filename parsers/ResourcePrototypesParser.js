const SectionTypes = require('../SectionTypes');
const utilsHelpers = require('../utils/index');
const ResourcePrototypesElement = require('./elements/ResourcePrototypesElement');

const ResourcePrototypesRegex = /^[Rr]esource\s+[Pp]rototypes$/;

module.exports = (Parsers) => {
  Parsers.ResourcePrototypesParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utilsHelpers.nextNode(node), new ResourcePrototypesElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utilsHelpers.headerText(node, context.sourceLines);

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
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    finalize(context, result) {
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);
      result.sourceMap = utils.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps], sourceBuffer, linefeedOffsets);

      return result;
    },
  });
  return true;
};
