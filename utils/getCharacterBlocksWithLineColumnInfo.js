const CharBlock = require('./sourceMap/CharBlock');
const CharBlockWithLineColumnInfo = require('./sourceMap/CharBlockWithLineColumnInfo');

module.exports = function getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets) {
  return byteBlocks.map(byteBlock => {
    const charBlock = CharBlock.fromByteBlock(byteBlock, sourceBuffer);
    const info = getLineColumnInfo(charBlock, linefeedOffsets);
    return new CharBlockWithLineColumnInfo(charBlock, info);
  });
};

function getLineColumnInfo(characterBlock, linefeedOffsets) {
  const startOffset = characterBlock.offset;
  const length = characterBlock.length;

  const startLinefeedIndex = linefeedOffsets.findIndex(linefeedOffset => linefeedOffset > startOffset);
  const startLine = startLinefeedIndex + 1;
  const startColumn = (startLinefeedIndex > 0) ? (startOffset - linefeedOffsets[startLinefeedIndex - 1]) : (startOffset + 1);

  const endOffset = (startOffset + length - 1);
  const endLinefeedIndex = linefeedOffsets.findIndex(linefeedOffset => linefeedOffset >= endOffset);
  const endLine = endLinefeedIndex + 1;
  const endColumn = (endLinefeedIndex > 0) ? (endOffset - linefeedOffsets[endLinefeedIndex - 1]) : (endOffset + 1);

  return { startLine, startColumn, endLine, endColumn };
}
