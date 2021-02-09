const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utilsHelpers = require('../utils/index');

const requestRegexp = new RegExp(`^[Rr]equest(\\s+${RegExpStrings.symbolIdentifier})?${RegExpStrings.mediaType}?$`);

const RequestElement = require('./elements/RequestElement');
const SchemaElement = require('./elements/SchemaElement');
const HeadersElement = require('./elements/HeadersElement');
const BodyElement = require('./elements/BodyElement');

module.exports = (Parsers) => {
  Parsers.RequestParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      context.pushFrame();

      const subject = utilsHelpers.nodeText(node.firstChild, context.sourceLines).split('\n');
      const [matchData, matchDataIndexes] = utilsHelpers.matchStringToRegex(subject[0], requestRegexp);

      const title = matchData[2];
      const contentType = matchData[4];

      if (subject.length > 1) {
        context.data.startOffset = subject[0].length + 1;
      }

      let titleEl = null;

      if (title) {
        titleEl = utilsHelpers.makeStringElement(title, matchDataIndexes[2], node.firstChild, context);
      }

      const requestSourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const result = new RequestElement(contentType, titleEl, requestSourceMap);

      if (contentType) {
        const contentTypeSourceMap = utilsHelpers.makeSourceMapsForStartPosAndLength(
          matchDataIndexes[4],
          contentType.length,
          node.firstChild,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        );
        const headersElement = new HeadersElement(
          [{
            key: 'Content-Type',
            val: result.contentType,
            sourceMap: contentTypeSourceMap,
          }],
          contentTypeSourceMap,
        );
        result.headersSections.push(headersElement);
      }

      const nextNode = subject.length > 1 ? node.firstChild : utilsHelpers.nextNode(node.firstChild);

      return [nextNode, result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = (utilsHelpers.nodeText(node.firstChild, context.sourceLines)).split('\n');
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
        Parsers.RequestParser,
        Parsers.ResponseParser,
        Parsers.ActionParser,
        Parsers.ResourceParser,
        Parsers.SubgroupParser,
        Parsers.MessageParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processDescription(node, context, result) {
      const parentNode = node && node.parent;

      const stopCallback = curNode => (!utilsHelpers.isCurrentNodeOrChild(curNode, parentNode) || this.nestedSectionType(curNode, context) !== SectionTypes.undefined);

      node.skipLines = context.data.startOffset ? 1 : 0;
      const [curNode, descriptionEl] = utilsHelpers.extractDescription(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback, context.data.startOffset);
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

      const hasCustomBody = result.content.find(item => (item instanceof BodyElement));
      const hasCustomSchema = result.content.find(item => (item instanceof SchemaElement));

      if (contentTypeHeader && !result.contentType) {
        result.contentType = contentTypeHeader.val;
      }

      if (!context.languageServerMode && !hasCustomBody) {
        const body = result.getBody(context.typeResolver.types);
        if (body !== undefined) {
          const bodyElement = new BodyElement(typeof body === 'object' ? JSON.stringify(body, null, 2) : body);
          bodyElement.contentType = result.contentType;
          result.content.push(bodyElement);
        }
      }

      if (!context.languageServerMode && !hasCustomSchema) {
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
