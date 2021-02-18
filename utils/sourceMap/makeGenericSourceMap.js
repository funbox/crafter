const makeGenericSourceMapFromStartAndEndNodes = require('./makeGenericSourceMapFromStartAndEndNodes');

module.exports = function makeGenericSourceMap(node, sourceLines, sourceBuffer, linefeedOffsets) {
  return makeGenericSourceMapFromStartAndEndNodes(node, node, sourceLines, sourceBuffer, linefeedOffsets);
};
