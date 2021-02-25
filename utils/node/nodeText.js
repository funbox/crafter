const getSourcePosZeroBased = require('../getSourcePosZeroBased');

module.exports = function nodeText(node, sourceLines) {
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
  const keepWhitespaces = node.type === 'code_block' || node.type === 'item';

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

  return result.map(line => (keepWhitespaces ? line : line.trim())).join('\n').trim();
};
