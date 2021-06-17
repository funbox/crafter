const getEndingLinefeedLengthInBytes = require('../getEndingLinefeedLengthInBytes');
const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const SourceMap = require('./SourceMap');
const ByteBlock = require('./ByteBlock');

module.exports = function makeSourceMapForLine(node, sourceLines, sourceBuffer, linefeedOffsets, currentFile) {
  const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);
  const lineIndex = startLineIndex;
  const indentation = startColumnIndex;

  const offset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
  const line = sourceLines[lineIndex];
  const lineWithoutIndentation = line.slice(indentation);
  const length = Buffer.byteLength(lineWithoutIndentation) + getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
  const byteBlock = new ByteBlock(offset, length, currentFile);

  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
