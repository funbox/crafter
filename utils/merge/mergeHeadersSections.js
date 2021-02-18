const HeadersElement = require('../../parsers/elements/HeadersElement');
const utilsSourceMap = require('../sourceMap');

module.exports = function mergeHeadersSections(headersSections) {
  return headersSections.reduce((result, headersSection) => {
    result.headers.push(...headersSection.headers);
    result.sourceMap = result.sourceMap
      ? utilsSourceMap.concatSourceMaps([result.sourceMap, headersSection.sourceMap])
      : headersSection.sourceMap;
    return result;
  }, new HeadersElement([], null));
};
