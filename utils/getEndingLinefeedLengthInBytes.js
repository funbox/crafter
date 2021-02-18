const { LINEFEED_BYTES } = require('../constants');

module.exports = function getEndingLinefeedLengthInBytes(lineIndex, sourceLines) {
  if (lineIndex < sourceLines.length - 1) {
    return LINEFEED_BYTES;
  }
  return 0;
};
