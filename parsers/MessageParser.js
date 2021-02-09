const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
const MessageElement = require('./elements/MessageElement');
const BodyElement = require('./elements/BodyElement');
const SchemaElement = require('./elements/SchemaElement');

const MessageHeaderRegex = new RegExp(`^[Mm]essage\\s*(${RegExpStrings.symbolIdentifier})?$`);

module.exports = (Parsers) => {
  Parsers.MessageParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title;
      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [matchData, matchDataIndexes] = utilsHelpers.matchStringToRegex(subject, MessageHeaderRegex);

      if (matchData[1]) {
        title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
      }

      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const result = new MessageElement(title, sourceMap);

      return [utilsHelpers.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (MessageHeaderRegex.exec(subject)) {
          return SectionTypes.message;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.BodyParser,
        Parsers.SchemaParser,
        Parsers.AttributesParser,
      ]);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.MessageParser,
        Parsers.ResourceParser,
        Parsers.SubgroupParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypeParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      if (Parsers.BodyParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.BodyParser.parse(node, context);
        result.content.push(childResult);
      } else if (Parsers.SchemaParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.SchemaParser.parse(node, context);
        result.content.push(childResult);
      } else {
        [nextNode, childResult] = Parsers.AttributesParser.parse(node, context);
        result.content.push(childResult);
      }

      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utilsHelpers.concatSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);
      result.sourceMap = utils.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps], sourceBuffer, linefeedOffsets);

      if (result.description) {
        result.sourceMap = utilsHelpers.concatSourceMaps([result.sourceMap, result.description.sourceMap], sourceBuffer, linefeedOffsets);
      }
      const hasCustomBody = result.content.find(item => (item instanceof BodyElement));
      const hasCustomSchema = result.content.find(item => (item instanceof SchemaElement));

      if (!hasCustomBody) {
        const body = result.getBody(context.typeResolver.types);
        if (body !== undefined) {
          const bodyElement = new BodyElement(typeof body === 'object' ? JSON.stringify(body, null, 2) : body);
          result.content.push(bodyElement);
        }
      }

      if (!hasCustomSchema) {
        const [schema] = result.getSchema(context.typeResolver.types);
        if (schema) {
          result.content.push(new SchemaElement(schema));
        }
      }

      return result;
    },
  });
  return true;
};
