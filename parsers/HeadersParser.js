const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const HeadersElement = require('./elements/HeadersElement');

const headersRegex = /^[Hh]eaders$/;

module.exports = (Parsers) => {
  Parsers.HeadersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const headersContentNode = node.firstChild.next;
      const headerLineRegex = /^([\w-]+)\s*:(.*)/;

      const headers = [];
      if (headersContentNode && headersContentNode.literal) {
        headersContentNode.literal.trim().split('\n').forEach((headerLine) => {
          headerLine = headerLine.trim();

          if (headerLineRegex.test(headerLine)) {
            // На случай, если значение хэдера содержит двоеточия - так оно целиком попадет в val.
            const [key, val] = headerLine.split(/:(.+)/);

            headers.push({
              key: key.trim(),
              val: val.trim(),
            });
          } else {
            context.logger.warn(`Ignoring unrecognized HTTP header "${headerLine}", expected "<header name>: <header value>", one header per line.`);
          }
        });
      }

      return [utils.nextNode(node), new HeadersElement(headers)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (headersRegex.exec(text)) {
          return SectionTypes.headers;
        }
      }

      return SectionTypes.undefined;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.BodyParser,
        Parsers.HeadersParser,
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
      return [node, result];
    },
  });
};
