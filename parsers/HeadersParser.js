const { LINEFEED_BYTES } = require('../constants');
const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const HeadersElement = require('./elements/HeadersElement');
const ByteBlock = require('../utils/sourceMap/ByteBlock');

const headersRegex = /^[Hh]eaders$/;

module.exports = (Parsers) => {
  Parsers.HeadersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const headers = this.parseHeaders(node, context);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
      return [utils.nextNode(node), new HeadersElement(headers, sourceMap)];
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

    processDescription(node, context, result) {
      return [node, result];
    },

    parseHeaders(node, context) {
      const contentNode = node.firstChild.next;
      const headers = [];

      if (!contentNode) {
        return headers;
      }

      const { sourceLines, sourceBuffer, linefeedOffsets, filename } = context;
      const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(contentNode);
      const headersSourceMap = utils.makeGenericSourceMap(node, sourceLines, sourceBuffer, linefeedOffsets, filename);
      const indentationBytes = startColumnIndex;

      if (contentNode.type !== 'code_block') {
        context.addWarning('"Headers" is expected to be a pre-formatted code block, every of its line indented by exactly 12 spaces or 3 tabs', headersSourceMap);
        return headers;
      }

      let offset = 0;
      const contentLines = contentNode.literal.trimRight().split('\n');

      contentLines.forEach((contentLine, contentLineIndex) => {
        const lineHasNonWhitespace = /\S/.test(contentLine);

        if (lineHasNonWhitespace) {
          if (contentLineIndex === 0) {
            offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
          } else {
            offset += indentationBytes;
          }

          const match = contentLine.match(/^(\s*)(.*)$/);
          const leadingWhitespaceBytes = Buffer.byteLength(match[1]);
          const restBytes = Buffer.byteLength(match[2]);
          offset += leadingWhitespaceBytes;
          const blockOffset = offset;
          offset += restBytes;
          const blockLength = offset - blockOffset;
          const block = new ByteBlock(blockOffset, blockLength, context.filename);
          const byteBlocks = [block];
          const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
          const sourceMap = new utils.SourceMap(byteBlocks, charBlocks);
          offset += LINEFEED_BYTES;

          const header = this.parseHeader(contentLine, context, { sourceMap });

          if (header) {
            header.sourceMap = sourceMap;
          }

          if (header) {
            headers.push(header);
          }
        } else {
          const sourceLine = sourceLines[startLineIndex + contentLineIndex];
          offset += Buffer.byteLength(sourceLine);
          offset += LINEFEED_BYTES;
        }
      });
      return headers;
    },

    parseHeader(headerLine, context, headerNodeDetails) {
      const logWarning = () => {
        context.addWarning(`Ignoring unrecognized HTTP header "${headerLine.trim()}", expected "<header name>: <header value>", one header per line.`, headerNodeDetails.sourceMap);
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

    allowLeavingNode: false,
  });
  return true;
};
