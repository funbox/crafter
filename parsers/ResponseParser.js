const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const BodyParser = require('./BodyParser');
const HeadersParser = require('./HeadersParser');

const responseRegex = /^[Rr]esponse(\s+(\d+))?(\s*\(([^\)]*)\))?$/;

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    context.pushFrame();

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

      context.data.contentType = matchData[4];
    }

    return utils.nextNode(node.firstChild);
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

  nestedSectionType(node, context) {
    return SectionTypes.calculateSectionType(node, context, [
      HeadersParser,
      BodyParser
    ]);
  },

  processNestedSection(node, context, result) {
    let nextNode, childResult;


    if (BodyParser.sectionType(node, context) !== SectionTypes.undefined) {
      [nextNode, childResult] = BodyParser.parse(node, context);

      if (context.data.contentType) {
        childResult.attributes = {
          contentType: context.data.contentType
        };
      }

      result.content.push(childResult);
    } else {
      [nextNode, childResult] = HeadersParser.parse(node, context);

      if (result.headers) {
        result.headers.content = result.headers.content.concat(childResult.content);
      } else {
        result.headers = childResult;
      }
    }

    return nextNode;
  },

  finalize(context, result) {
    context.popFrame();
  }
});