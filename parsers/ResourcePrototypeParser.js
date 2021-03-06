const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourcePrototypeElement = require('./elements/ResourcePrototypeElement');

const PrototypeHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourcePrototypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [matchData, matchDataIndexes] = utils.matchStringToRegex(subject, PrototypeHeaderRegex);

      const inheritedPrototypes = utils.buildPrototypeElements(matchData[3], subjectOffset + matchDataIndexes[3], node, context);

      const title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
      const resourcePrototypeEl = new ResourcePrototypeElement(title, inheritedPrototypes);
      resourcePrototypeEl.sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);

      return [utils.nextNode(node), resourcePrototypeEl];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        const subject = utils.headerText(node, context.sourceLines);
        if (PrototypeHeaderRegex.exec(subject)) {
          return SectionTypes.resourcePrototype;
        }
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
        Parsers.ImportParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResponseParser.parse(node, context);
      result.responses.push(childResult);
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
