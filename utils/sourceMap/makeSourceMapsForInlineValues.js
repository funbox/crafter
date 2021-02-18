const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const SourceMap = require('./SourceMap');

module.exports = function makeSourceMapsForInlineValues(value, inlineValues, node, sourceLines, sourceBuffer, linefeedOffsets) {
  sourceLines = node.sourceLines || sourceLines;
  sourceBuffer = node.sourceBuffer || sourceBuffer;
  linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
  const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);

  let lineStr = sourceLines[startLineIndex].slice(startColumnIndex);
  let columnIndex = startColumnIndex + lineStr.indexOf(value);
  lineStr = lineStr.slice(lineStr.indexOf(value));

  return inlineValues.map(inlineValue => {
    const inlineValueStr = String(inlineValue);
    columnIndex += lineStr.indexOf(inlineValueStr);
    lineStr = lineStr.slice(lineStr.indexOf(inlineValueStr));
    const byteBlock = {
      offset: getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex, sourceLines),
      length: Buffer.byteLength(inlineValueStr),
      file: node.file,
    };
    lineStr = lineStr.slice(inlineValueStr.length);
    columnIndex += inlineValueStr.length;
    const byteBlocks = [byteBlock];
    const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  });
};
