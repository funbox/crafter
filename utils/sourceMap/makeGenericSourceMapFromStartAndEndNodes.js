const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getEndingLinefeedLengthInBytes = require('../getEndingLinefeedLengthInBytes');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const getTrailingEmptyLinesLengthInBytes = require('../getTrailingEmptyLinesLengthInBytes');

const SourceMap = require('./SourceMap');
const ByteBlock = require('./ByteBlock');

const utilsLog = require('../log');

module.exports = function makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines, sourceBuffer, linefeedOffsets) {
  if (startNode.file !== endNode.file) {
    throw new utilsLog.CrafterError('startNode and endNode belong to different files');
  }
  const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(startNode);
  const { endLineIndex, endColumnIndex } = getSourcePosZeroBased(endNode);

  const startOffset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
  const endOffset = getOffsetFromStartOfFileInBytes(endLineIndex, endColumnIndex + 1, sourceLines);

  const baseLength = endOffset - startOffset;
  const linefeedLength = getEndingLinefeedLengthInBytes(endLineIndex, sourceLines);
  const trailingLinesLength = getTrailingEmptyLinesLengthInBytes(endLineIndex + 1, sourceLines);

  const length = baseLength + linefeedLength + trailingLinesLength;

  const byteBlock = new ByteBlock(startOffset, length, startNode.file);
  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
