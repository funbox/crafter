const utilsSourceMap = require('./sourceMap');
const StringElement = require('../parsers/elements/StringElement');

module.exports = function makeStringElement(str, offset, node, context) {
  const sourceMap = utilsSourceMap.makeSourceMapsForString(
    str,
    offset,
    node,
    context.sourceLines,
    context.sourceBuffer,
    context.linefeedOffsets,
  );
  return new StringElement(str, sourceMap);
};
