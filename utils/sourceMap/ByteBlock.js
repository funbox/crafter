class ByteBlock {
  /**
   * @param {number} offset - смещение начала блока от начала файла в байтах
   * @param {number} length - длина блока в байтах
   * @param {string=} file - путь к файлу, к которому относится блок
   */
  constructor(offset, length, file) {
    this.offset = offset;
    this.length = length;
    this.file = file;
  }
}

module.exports = ByteBlock;
