const getEndingLinefeedLengthInBytes = require('../getEndingLinefeedLengthInBytes');
const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const SourceMap = require('./SourceMap');

module.exports = function makeSourceMapForLine(node, sourceLines, sourceBuffer, linefeedOffsets) {
  sourceLines = node.sourceLines || sourceLines;
  sourceBuffer = node.sourceBuffer || sourceBuffer;
  linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
  const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);
  const lineIndex = startLineIndex;
  const indentation = node.sourcepos[0][1] - 1;

  const offset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
  const byteBlock = { offset, length: 0 };
  const line = sourceLines[lineIndex];
  const lineWithoutIndentation = line.slice(indentation);

  let length = Buffer.byteLength(lineWithoutIndentation);
  length += getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
  byteBlock.length += length;
  byteBlock.file = node.file;

  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
