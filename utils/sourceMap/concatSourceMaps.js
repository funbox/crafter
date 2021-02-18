const SourceMap = require('./SourceMap');

module.exports = function concatSourceMaps(sourceMaps) {
  const result = new SourceMap([], []);
  sourceMaps.forEach(sm => {
    result.byteBlocks.push(...sm.byteBlocks);
    result.charBlocks.push(...sm.charBlocks);
  });

  return result;
};
