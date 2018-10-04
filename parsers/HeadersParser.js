const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const HeadersElement = require('./elements/HeadersElement');

const headersRegex = /^[Hh]eaders$/;

module.exports = (Parsers) => {
  Parsers.HeadersParser = Object.assign(Object.create(require('./AbstractParser')), {
    // TODO: Обработать кривые заголовки (когда не в формате Name: Value)
    processSignature(node) {
      const headersContentNode = node.firstChild.next;

      let headers = [];
      if (headersContentNode) {
        headers = (headersContentNode.literal || '').trim().split('\n').map((headerLine) => {
          const [key, val] = headerLine.split(':');
          return {
            key: key.trim(),
            val: val.trim(),
          };
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
