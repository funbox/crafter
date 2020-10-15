const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const MessageElement = require('./elements/MessageElement');
const StringElement = require('./elements/StringElement');
const BodyElement = require('./elements/BodyElement');
const SchemaElement = require('./elements/SchemaElement');

const MessageHeaderRegex = new RegExp(`^[Mm]essage\\s*(${RegExpStrings.symbolIdentifier})?$`);

module.exports = (Parsers) => {
  Parsers.MessageParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title = '';
      const matchData = MessageHeaderRegex.exec(utils.headerText(node, context.sourceLines)[0]);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      if (matchData[1]) {
        title = matchData[1];
      }

      const titleEl = title ? new StringElement(title, sourceMap) : undefined;
      const result = new MessageElement(titleEl, sourceMap);

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines)[0];

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

      return [nextNode, result];
    },

    finalize(context, result) {
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
