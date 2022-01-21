class ByteBlock {
  /**
   * @param {number} offset - offset of a block from the start of a file counted in bytes
   * @param {number} length - length of a block in bytes
   * @param {string=} file - path to a file that contains a block
   */
  constructor(offset, length, file) {
    this.offset = offset;
    this.length = length;
    this.file = file;
  }
}

module.exports = ByteBlock;
