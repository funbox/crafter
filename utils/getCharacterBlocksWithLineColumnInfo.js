module.exports = function getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets) {
  return byteBlocks.map(byteBlock => {
    const charBlock = byteBlockToCharacterBlock(byteBlock, sourceBuffer);
    const info = getLineColumnInfo(charBlock, linefeedOffsets);
    return { ...charBlock, ...info };
  });
};

function byteBlockToCharacterBlock(byteBlock, sourceBuffer) {
  const charOffset = sourceBuffer.slice(0, byteBlock.offset).toString().length;
  const charLength = sourceBuffer.slice(byteBlock.offset, byteBlock.offset + byteBlock.length).toString().length;
  return { offset: charOffset, length: charLength, file: byteBlock.file };
}

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
