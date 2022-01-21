class CharBlock {
  /**
   * @param {ByteBlock} byteBlock
   * @param {Buffer} sourceBuffer
   */
  static fromByteBlock(byteBlock, sourceBuffer) {
    const charOffset = sourceBuffer.slice(0, byteBlock.offset).toString().length;
    const charLength = sourceBuffer.slice(byteBlock.offset, byteBlock.offset + byteBlock.length).toString().length;

    return new CharBlock(charOffset, charLength, byteBlock.file);
  }

  /**
   * @param {number} offset - offset of a block from the start of a file counted in characters
   * @param {number} length - length of a block in characters
   * @param {string=} file - path to a file that contains a block
   */
  constructor(offset, length, file) {
    this.offset = offset;
    this.length = length;
    this.file = file;
  }
}

module.exports = CharBlock;
