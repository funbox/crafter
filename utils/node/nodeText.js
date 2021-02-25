const getSourcePosZeroBased = require('../getSourcePosZeroBased');

module.exports = function nodeText(node, sourceLines, lineFormatter) {
  if (!node) {
    return '';
  }

  const localSourceLines = node.sourceLines || sourceLines;
  const {
    startLineIndex,
    endLineIndex,
    startColumnIndex,
    endColumnIndex,
  } = getSourcePosZeroBased(node);

  const result = [];

  if (startLineIndex === endLineIndex) {
    result.push(localSourceLines[startLineIndex].slice(startColumnIndex, endColumnIndex + 1));
  } else {
    result.push(localSourceLines[startLineIndex].slice(startColumnIndex));

    for (let i = startLineIndex + 1; i < endLineIndex; i += 1) {
      result.push(localSourceLines[i]);
    }

    result.push(localSourceLines[endLineIndex].slice(0, endColumnIndex + 1));
  }

  const formatted = lineFormatter ? result.map(lineFormatter) : result;
  return formatted.join('\n').trim();
};
