const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const ResourcePrototypeElement = require('./elements/ResourcePrototypeElement');

const PrototypeHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourcePrototypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [matchData, matchDataIndexes] = utilsHelpers.matchStringToRegex(subject, PrototypeHeaderRegex);

      const inheritedPrototypes = utils.buildPrototypeElements(matchData[3], subjectOffset + matchDataIndexes[3], node, context);

      const title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
      const resourcePrototypeEl = new ResourcePrototypeElement(title, inheritedPrototypes);
      resourcePrototypeEl.sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      return [utilsHelpers.nextNode(node), resourcePrototypeEl];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.resourcePrototype;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResponseParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
        Parsers.ResourcePrototypeParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResponseParser.parse(node, context);
      result.responses.push(childResult);
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
