const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const MessageElement = require('./elements/MessageElement');
const BodyElement = require('./elements/BodyElement');
const BodyTemplateElement = require('./elements/BodyTemplateElement');
const SchemaElement = require('./elements/SchemaElement');

const MessageHeaderRegex = new RegExp(`^[Mm]essage\\s*(${RegExpStrings.symbolIdentifier})?$`);

module.exports = (Parsers) => {
  Parsers.MessageParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title;
      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [matchData, matchDataIndexes] = utils.matchStringToRegex(subject, MessageHeaderRegex);

      if (matchData[1]) {
        title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
      }

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
      const result = new MessageElement(title, sourceMap);

      return [utils.nextNode(node), result];
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
        Parsers.ImportParser,
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

      result.sourceMap = utils.concatSourceMaps([result.sourceMap, childResult.sourceMap]);

      return [nextNode, result];
    },

    finalize(context, result) {
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);
      result.sourceMap = utils.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps]);

      if (result.description) {
        result.sourceMap = utils.concatSourceMaps([result.sourceMap, result.description.sourceMap]);
      }
      const hasCustomBody = result.content.find(item => (item instanceof BodyElement));
      const hasCustomSchema = result.content.find(item => (item instanceof SchemaElement));

      if (!hasCustomBody) {
        const bodyTemplate = result.getBody(context.typeResolver.types);
        if (bodyTemplate !== undefined) {
          const body = utils.makeDefaultBodyFromTemplate(bodyTemplate);
          const bodyStr = typeof body === 'object' ? JSON.stringify(body, null, 2) : body;
          const bodyTemplateStr = typeof bodyTemplate === 'object' ? JSON.stringify(bodyTemplate, null, 2) : bodyTemplate;

          const bodyElement = new BodyElement(bodyStr);
          result.content.push(bodyElement);

          if (bodyTemplateStr !== bodyStr) {
            const bodyTemplateElement = new BodyTemplateElement(bodyTemplateStr);
            result.content.push(bodyTemplateElement);
          }
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
