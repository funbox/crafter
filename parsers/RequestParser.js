const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');

const requestRegexp = new RegExp(`^[Rr]equest(\\s+${RegExpStrings.symbolIdentifier})?${RegExpStrings.mediaType}?$`);

const RequestElement = require('./elements/RequestElement');
const SchemaElement = require('./elements/SchemaElement');
const HeadersElement = require('./elements/HeadersElement');

module.exports = (Parsers) => {
  Parsers.RequestParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const subject = (utils.headerText(node.firstChild, context.sourceLines)).split('\n');
      const matchData = requestRegexp.exec(subject[0]);

      const title = matchData[2];
      const contentType = matchData[4];

      if (subject.length > 1) {
        context.data.startOffset = subject[0].length + 1;
      }

      const result = new RequestElement(contentType, title);
      if (context.sourceMapsEnabled) {
        result.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
      }

      if (result.contentType) {
        const headersElement = new HeadersElement([{
          key: 'Content-Type',
          val: result.contentType,
          sourceMap: result.sourceMap,
        }]);
        result.headersSections.push(headersElement);
      }

      const nextNode = subject.length > 1 ? node.firstChild : utils.nextNode(node.firstChild);

      return [nextNode, result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = (utils.nodeText(node.firstChild, context.sourceLines)).split('\n');
        if (requestRegexp.exec(text[0])) {
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

    processDescription(node, context, result) {
      const parentNode = node && node.parent;

      const stopCallback = curNode => (!utils.isCurrentNodeOrChild(curNode, parentNode) || this.nestedSectionType(curNode, context) !== SectionTypes.undefined);

      node.skipLines = context.data.startOffset ? 1 : 0;
      const [curNode, descriptionEl] = utils.extractDescription(node, context.sourceLines, context.sourceMapsEnabled, stopCallback, context.data.startOffset);
      delete node.skipLines;

      if (descriptionEl) {
        result.description = descriptionEl;
      }

      return [curNode, result];
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
      context.popFrame();

      const contentTypeHeader = result.headersSections.length && result.headersSections.reduce((prevHeader, section) => {
        const ctHeader = section.headers.find(h => h.key === 'Content-Type');
        return ctHeader || prevHeader;
      }, null);

      if (contentTypeHeader && !result.contentType) {
        result.contentType = contentTypeHeader.val;
      }

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
