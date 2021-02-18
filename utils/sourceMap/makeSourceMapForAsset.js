const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const { LINEFEED_BYTES } = require('../../constants');
const SourceMap = require('./SourceMap');

module.exports = function makeSourceMapForAsset(node, sourceLines, sourceBuffer, linefeedOffsets) {
  sourceLines = node.sourceLines || sourceLines;
  sourceBuffer = node.sourceBuffer || sourceBuffer;
  linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
  const byteBlocks = [];
  const { startLineIndex, startColumnIndex, endLineIndex } = getSourcePosZeroBased(node);
  const numSpacesPerIndentLevel = 4;
  const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
  let offset = getOffsetFromStartOfFileInBytes(startLineIndex, indentation, sourceLines);
  for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
    const line = sourceLines[lineIndex];
    if (/\S/.test(line)) {
      const lineWithoutIndentation = line.slice(indentation);
      let length = Buffer.byteLength(lineWithoutIndentation);
      if (lineIndex < sourceLines.length - 1) {
        length += LINEFEED_BYTES;
      }
      byteBlocks.push({ offset, length, file: node.file });
      offset += length;
      offset += indentation;
    } else {
      offset += Buffer.byteLength(line) + LINEFEED_BYTES;
    }
  }

  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
