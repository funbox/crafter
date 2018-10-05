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
        const startLineIndex = contentNode.sourcepos[0][0] - 1;
        const startColumnIndex = contentNode.sourcepos[0][1] - 1;

        const linefeedByte = 1;
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

            const colonIndex = contentLine.indexOf(':');
            if (colonIndex < 0) {
              throw new utils.CrafterError(`Header doesn't contain colon: ${contentLine}`);
            }

            const beforeColon = contentLine.slice(0, colonIndex);
            const afterColon = contentLine.slice(colonIndex + 1);

            const keyMatch = beforeColon.match(/^\s*(\S+)\s*$/);
            if (!keyMatch) {
              throw new utils.CrafterError(`Failed to parse header key: ${contentLine}`);
            }
            const key = keyMatch[1];

            const valMatch = afterColon.match(/^\s*(\S.*)$/);
            if (!valMatch) {
              throw new utils.CrafterError(`Failed to parse header value: ${contentLine}`);
            }
            const val = valMatch[1];

            const header = { key, val };

            if (context.sourceMapsEnabled) {
              const match = contentLine.match(/^(\s*)(.*)$/);
              const leadingWhitespaceBytes = Buffer.byteLength(match[1]);
              const restBytes = Buffer.byteLength(match[2]);
              const block = {};
              offset += leadingWhitespaceBytes;
              block.offset = offset;
              offset += restBytes;
              block.length = offset - block.offset;
              header.sourceMap = new SourceMapElement([block], contentNode.file);
              offset += linefeedByte;
            }

            headers.push(header);
          } else if (context.sourceMapsEnabled) {
            const sourceLine = context.sourceLines[startLineIndex + contentLineIndex];
            offset += Buffer.byteLength(sourceLine);
            offset += linefeedByte;
          }
        }
      }

      return headers;
    },
  });
};
