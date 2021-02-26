class CharBlockWithLineColumnInfo {
  /**
   *
   * @param {CharBlock} basicCharBlock
   * @param {Object} info
   * @param {number} info.startLine
   * @param {number} info.startColumn
   * @param {number} info.endLine
   * @param {number} info.endColumn
   */
  constructor(basicCharBlock, info) {
    this.offset = basicCharBlock.offset;
    this.length = basicCharBlock.length;
    this.file = basicCharBlock.file;
    this.startLine = info.startLine;
    this.startColumn = info.startColumn;
    this.endLine = info.endLine;
    this.endColumn = info.endColumn;
  }
}

module.exports = CharBlockWithLineColumnInfo;
