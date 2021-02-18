const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const SourceMap = require('./SourceMap');

module.exports = function makeSourceMapsForStartPosAndLength(startPos, length, node, sourceLines, sourceBuffer, linefeedOffsets) {
  sourceLines = node.sourceLines || sourceLines;
  sourceBuffer = node.sourceBuffer || sourceBuffer;
  linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
  const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);

  const columnIndex = startColumnIndex + startPos;

  const offset = getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex, sourceLines);
  const lengthInBytes = getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex + length, sourceLines) - offset;
  const byteBlock = {
    offset,
    length: lengthInBytes,
    file: node.file,
  };
  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
