const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getEndingLinefeedLengthInBytes = require('../getEndingLinefeedLengthInBytes');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const getTrailingEmptyLinesLengthInBytes = require('../getTrailingEmptyLinesLengthInBytes');

const SourceMap = require('./SourceMap');
const ByteBlock = require('./ByteBlock');

const utilsLog = require('../log');

module.exports = function makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines, sourceBuffer, linefeedOffsets) {
  sourceLines = startNode.sourceLines || sourceLines;
  sourceBuffer = startNode.sourceBuffer || sourceBuffer;
  linefeedOffsets = startNode.linefeedOffsets || linefeedOffsets;
  if (startNode.file !== endNode.file) {
    throw new utilsLog.CrafterError('startNode and endNode belong to different files');
  }
  const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(startNode);
  const { endLineIndex, endColumnIndex } = getSourcePosZeroBased(endNode);

  const numSpacesPerIndentLevel = 4;
  const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
  const startOffset = getOffsetFromStartOfFileInBytes(startLineIndex, indentation, sourceLines);
  const endOffset = getOffsetFromStartOfFileInBytes(endLineIndex, endColumnIndex + 1, sourceLines);

  let length = endOffset - startOffset;
  length += getEndingLinefeedLengthInBytes(endLineIndex, sourceLines);

  if (endNode.next || !/\S/.test(sourceLines[endLineIndex + 1])) {
    length += getTrailingEmptyLinesLengthInBytes(endLineIndex + 1, sourceLines);
  }
  const byteBlock = new ByteBlock(startOffset, length, startNode.file);
  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
