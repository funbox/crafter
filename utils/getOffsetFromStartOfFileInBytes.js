const getEndingLinefeedLengthInBytes = require('./getEndingLinefeedLengthInBytes');

module.exports = function getOffsetFromStartOfFileInBytes(lineIndex, columnIndex, sourceLines) {
  let result = 0;
  for (let i = 0; i < lineIndex; i += 1) {
    const str = sourceLines[i];
    result += Buffer.byteLength(str);
    result += getEndingLinefeedLengthInBytes(i, sourceLines);
  }
  const str = sourceLines[lineIndex].substring(0, columnIndex);
  result += Buffer.byteLength(str);
  return result;
};
