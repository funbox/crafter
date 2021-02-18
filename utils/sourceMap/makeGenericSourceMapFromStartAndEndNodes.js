const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getEndingLinefeedLengthInBytes = require('../getEndingLinefeedLengthInBytes');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');

const SourceMap = require('./SourceMap');

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
  const startOffset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
  const endOffset = getOffsetFromStartOfFileInBytes(endLineIndex, endColumnIndex + 1, sourceLines);
  let length = endOffset - startOffset;
  length += getEndingLinefeedLengthInBytes(endLineIndex, sourceLines);
  if (endNode.next) {
    length += getTrailingEmptyLinesLengthInBytes(endLineIndex + 1, sourceLines);
  }
  const byteBlock = { offset: startOffset, length, file: startNode.file };
  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};

function getTrailingEmptyLinesLengthInBytes(lineIndex, sourceLines) {
  let result = 0;
  for (let i = lineIndex; i < sourceLines.length && !/\S/.test(sourceLines[i]); i += 1) {
    result += sourceLines[i].length;
    result += getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
  }
  return result;
}
