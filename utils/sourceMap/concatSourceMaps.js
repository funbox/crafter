const SourceMap = require('./SourceMap');

module.exports = function concatSourceMaps(sourceMaps) {
  const result = new SourceMap([], []);
  const byteBlocks = [];
  const charBlocks = [];
  sourceMaps.forEach(sm => {
    byteBlocks.push(...sm.byteBlocks);
    charBlocks.push(...sm.charBlocks);
  });

  result.byteBlocks = prepareBlocks(byteBlocks);
  result.charBlocks = prepareBlocks(charBlocks);

  return result;
};

function prepareBlocks(blocks) {
  // this preparation is actual in the case when there are two source map blocks, and one of them includes the other.
  // For example, during parsing of tests/fixtures/inheritance/object-named-type-inheritance.apib
  // two source map blocks are created:
  // # Admin (User)
  // and
  // User
  // with the help of this function, only one block remains
  let baseBlock;
  return blocks
    .sort((a, z) => (
      (a.file || '').localeCompare(z.file || '')
      || a.offset - z.offset
      || z.length - a.length
    ))
    .filter(el => {
      if (!baseBlock
        || baseBlock.file !== el.file
        || el.offset >= baseBlock.offset + baseBlock.length
      ) {
        baseBlock = el;
        return true;
      }
      return false;
    });
}
