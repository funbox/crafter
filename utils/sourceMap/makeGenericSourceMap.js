const makeGenericSourceMapFromStartAndEndNodes = require('./makeGenericSourceMapFromStartAndEndNodes');

module.exports = function makeGenericSourceMap(node, sourceLines, sourceBuffer, linefeedOffsets, currentFile) {
  return makeGenericSourceMapFromStartAndEndNodes(node, node, sourceLines, sourceBuffer, linefeedOffsets, currentFile);
};
