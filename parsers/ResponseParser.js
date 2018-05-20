const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const responseRegex = /^[Rr]esponse(\s+(\d+))?(\s*\(([^\)]*)\))?$/;

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    result.element = Refract.elements.httpResponse;

    const subject = utils.headerText(node.firstChild, context.sourceLines);
    const matchData = responseRegex.exec(subject);

    if (matchData[2]) {
      result.attributes = {
        statusCode: {
          element: Refract.elements.string,
          content: matchData[2],
        }
      };
    }

    if (matchData[4]) {
      result.headers = {
        element: Refract.elements.httpHeaders,
        content: [{
          element: Refract.elements.member,
          content: {
            key: {
              element: Refract.elements.string,
              content: 'Content-Type',
            },
            value: {
              element: Refract.elements.string,
              content: matchData[4],
            }
          }
        }]
      };
    }

    return utils.nextNode(node);
  },

  sectionType(node, context) {
    if (node.type === 'item') {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
      if (responseRegex.exec(text)) {
        return SectionTypes.response;
      }
    }

    return SectionTypes.undefined;
  },
});