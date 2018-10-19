const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const HeadersElement = require('./elements/HeadersElement');
const SourceMapElement = require('./elements/SourceMapElement');

const headersRegex = /^[Hh]eaders$/;

module.exports = (Parsers) => {
  Parsers.HeadersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const headers = this.parseHeaders(node, context);
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

    parseHeaders(node, context) {
      const contentNode = node.firstChild.next;
      const headers = [];

      if (contentNode) {
        const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(contentNode);

        const indentationBytes = startColumnIndex;

        let offset = context.sourceMapsEnabled ? utils.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, context.sourceLines) : 0;

        const contentLines = contentNode.literal.trimRight().split('\n');

        for (let contentLineIndex = 0; contentLineIndex < contentLines.length; contentLineIndex += 1) {
          const contentLine = contentLines[contentLineIndex];
          const lineHasNonWhitespace = /\S/.exec(contentLine);

          if (lineHasNonWhitespace) {
            if (context.sourceMapsEnabled && contentLineIndex > 0) {
              offset += indentationBytes;
            }

            const header = this.parseHeader(contentLine, context);

            if (context.sourceMapsEnabled) {
              const match = contentLine.match(/^(\s*)(.*)$/);
              const leadingWhitespaceBytes = Buffer.byteLength(match[1]);
              const restBytes = Buffer.byteLength(match[2]);
              const block = {};
              offset += leadingWhitespaceBytes;
              block.offset = offset;
              offset += restBytes;
              block.length = offset - block.offset;
              if (header) {
                header.sourceMap = new SourceMapElement([block], contentNode.file);
              }
              offset += utils.linefeedBytes;
            }

            if (header) {
              headers.push(header);
            }
          } else if (context.sourceMapsEnabled) {
            const sourceLine = context.sourceLines[startLineIndex + contentLineIndex];
            offset += Buffer.byteLength(sourceLine);
            offset += utils.linefeedBytes;
          }
        }
      }

      return headers;
    },

    parseHeader(headerLine, context) {
      const logWarning = () => {
        context.logger.warn(`Ignoring unrecognized HTTP header "${headerLine.trim()}", expected "<header name>: <header value>", one header per line.`);
      };

      const colonIndex = headerLine.indexOf(':');
      if (colonIndex < 0) {
        logWarning();
        return null;
      }

      const beforeColon = headerLine.slice(0, colonIndex);
      const afterColon = headerLine.slice(colonIndex + 1);

      const keyMatch = beforeColon.match(/^\s*(\S+)\s*$/);
      if (!keyMatch) {
        logWarning();
        return null;
      }
      const key = keyMatch[1];

      const valMatch = afterColon.match(/^\s*(\S.*)$/);
      if (!valMatch) {
        logWarning();
        return null;
      }
      const val = valMatch[1];

      return { key, val };
    },
  });
};
