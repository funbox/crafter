const makeSourceMapsForStartPosAndLength = require('./makeSourceMapsForStartPosAndLength');

module.exports = function makeSourceMapsForString(str, offset, node, sourceLines, sourceBuffer, linefeedOffsets, currentFile) {
  return makeSourceMapsForStartPosAndLength(offset, str.length, node, sourceLines, sourceBuffer, linefeedOffsets, currentFile);
};
