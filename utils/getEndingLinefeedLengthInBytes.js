const linefeedBytes = require('./linefeedBytes');

module.exports = function getEndingLinefeedLengthInBytes(lineIndex, sourceLines) {
  if (lineIndex < sourceLines.length - 1) {
    return linefeedBytes;
  }
  return 0;
};
