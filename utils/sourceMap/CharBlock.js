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
   * @param {number} offset - смещение начала блока от начала файла в символах
   * @param {number} length - длина блока в символах
   * @param {string=} file - путь к файлу, к которому относится блок
   */
  constructor(offset, length, file) {
    this.offset = offset;
    this.length = length;
    this.file = file;
  }
}

module.exports = CharBlock;
