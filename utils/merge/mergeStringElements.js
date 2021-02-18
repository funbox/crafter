const StringElement = require('../../parsers/elements/StringElement');
const utilsSourceMap = require('../sourceMap');

module.exports = function mergeStringElements(first, second) {
  const merged = new StringElement(first.string + second.string);
  if (first.sourceMap && second.sourceMap) {
    merged.sourceMap = utilsSourceMap.concatSourceMaps([first.sourceMap, second.sourceMap]);
  }
  return merged;
};
