const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const utilsHelpers = require('../utils/index.js');
const HeadersElement = require('./elements/HeadersElement');

const headersRegex = /^[Hh]eaders$/;

module.exports = (Parsers) => {
  Parsers.HeadersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const headers = this.parseHeaders(node, context);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utils.nextNode(node), new HeadersElement(headers, sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
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
        Parsers.ParametersParser,
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
      return [node, result];
    },

    parseHeaders(node, context) {
      const contentNode = node.firstChild.next;
      const headers = [];

      if (!contentNode) {
        return headers;
      }

      const sourceLines = contentNode.sourceLines || context.sourceLines;
      const sourceBuffer = contentNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = contentNode.linefeedOffsets || context.linefeedOffsets;

      const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(contentNode);
      const headersSourceMap = utils.makeSourceMapForAsset(contentNode, sourceLines, sourceBuffer, linefeedOffsets);
      const indentationBytes = startColumnIndex;

      if (contentNode.type !== 'code_block') {
        context.addWarning('"Headers" is expected to be a pre-formatted code block, every of its line indented by exactly 12 spaces or 3 tabs', headersSourceMap);
        return headers;
      }

      let offset = 0;
      const contentLines = contentNode.literal.trimRight().split('\n');

      contentLines.forEach((contentLine, contentLineIndex) => {
        const lineHasNonWhitespace = /\S/.exec(contentLine);

        if (lineHasNonWhitespace) {
          if (contentLineIndex === 0) {
            offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
          } else {
            offset += indentationBytes;
          }

          const match = contentLine.match(/^(\s*)(.*)$/);
          const leadingWhitespaceBytes = Buffer.byteLength(match[1]);
          const restBytes = Buffer.byteLength(match[2]);
          const block = {};
          offset += leadingWhitespaceBytes;
          block.offset = offset;
          offset += restBytes;
          block.length = offset - block.offset;
          block.file = contentNode.file;
          const byteBlocks = [block];
          const charBlocks = utilsHelpers.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
          const sourceMap = new utils.SourceMap(byteBlocks, charBlocks);
          offset += utils.linefeedBytes;

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
          offset += utils.linefeedBytes;
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
