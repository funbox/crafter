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
  // Данная подготовка нужна на случай когда есть 2 source map, причем один из них включает в себя другой.
  // Например, при парсинге tests/fixtures/inheritance/object-named-type-inheritance.apib
  // возникают два source map:
  // # Admin (User)
  // и
  // User
  // чтобы оставить только первый из них нужна эта функция фильтрации
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
