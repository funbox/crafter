class SourceMap {
  /**
   * @param {ByteBlock[]} byteBlocks
   * @param {CharBlockWithLineColumnInfo[]} charBlocks
   */
  constructor(byteBlocks, charBlocks) {
    this.byteBlocks = byteBlocks;
    this.charBlocks = charBlocks;
  }
}

module.exports = SourceMap;
