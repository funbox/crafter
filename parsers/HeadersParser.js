const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const headersRegex = /^[Hh]eaders$/;

module.exports = (Parsers) => {
  Parsers.HeadersParser = Object.assign(Object.create(require('./AbstractParser')), {
    // TODO: Обработать кривые заголовки (когда не в формате Name: Value)
    processSignature(node, context, result) {
      result.element = Refract.elements.httpHeaders;

      const headersContentNode = node.firstChild.next;

      if (headersContentNode) {
        (headersContentNode.literal || '').trim().split('\n').forEach(headerLine => {
          const [key, val] = headerLine.split(':');
          result.content.push({
            element: Refract.elements.member,
            content: {
              key: {
                element: Refract.elements.string,
                content: key.trim(),
              },
              value: {
                element: Refract.elements.string,
                content: val.trim(),
              }
            }
          });
        });
      }

      return utils.nextNode(node);
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
        if (headersRegex.exec(text)) {
          return SectionTypes.headers;
        }
      }

      return SectionTypes.undefined;
    },

    processDescription(node) {
      return node;
    },
  });
};