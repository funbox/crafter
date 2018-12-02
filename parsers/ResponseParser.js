const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResponseElement = require('./elements/ResponseElement');
const SchemaElement = require('./elements/SchemaElement');

const responseRegex = new RegExp(`^[Rr]esponse(\\s+(\\d+))?${RegExpStrings.mediaType}?$`);

// TODO: Объединить с RequestParser, т.к. много общего?
module.exports = (Parsers) => {
  Parsers.ResponseParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const subject = utils.headerText(node.firstChild, context.sourceLines);
      const matchData = responseRegex.exec(subject);

      const result = new ResponseElement(matchData[2], matchData[4]);
      if (context.sourceMapsEnabled) {
        result.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      }

      return [utils.nextNode(node.firstChild), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (responseRegex.exec(text)) {
          return SectionTypes.response;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.HeadersParser,
        Parsers.BodyParser,
        Parsers.SchemaParser,
        Parsers.AttributesParser,
      ]);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ParameterParser,
        Parsers.RequestParser,
        Parsers.ResponseParser,
        Parsers.ActionParser,
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      if (Parsers.BodyParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.BodyParser.parse(node, context);
        childResult.contentType = result.contentType;
        result.content.push(childResult);
      } else if (Parsers.HeadersParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.HeadersParser.parse(node, context);
        result.headersSections.push(childResult);
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
      if (result.content.find(item => (item instanceof SchemaElement))) {
        return result;
      }
      const schema = result.getSchema(context.typeResolver.types);
      if (Object.keys(schema).length > 0) {
        result.content.push(new SchemaElement(schema));
      }
      return result;
    },
  });
};
