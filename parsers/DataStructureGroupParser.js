const SectionTypes = require('../SectionTypes');
const utilsHelpers = require('../utils/index');
const DataStructureGroupElement = require('./elements/DataStructureGroupElement');

const DataStructureGroupRegex = /^[Dd]ata\s+[Ss]tructures?$/;

module.exports = (Parsers) => {
  Parsers.DataStructureGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utilsHelpers.nextNode(node), new DataStructureGroupElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utilsHelpers.headerText(node, context.sourceLines);

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
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utilsHelpers.concatSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

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
