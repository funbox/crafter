module.exports = function nodeText(node, sourceLines) {
  if (!node) {
    return '';
  }

  const localSourceLines = node.sourceLines || sourceLines;
  const [startline, startcolumn] = node.sourcepos[0];
  const [endline, endcolumn] = node.sourcepos[1];
  const keepWhitespaces = node.type === 'code_block' || node.type === 'item';

  const result = [];

  if (startline === endline) {
    result.push(localSourceLines[startline - 1].slice(startcolumn - 1, endcolumn));
  } else {
    result.push(localSourceLines[startline - 1].slice(startcolumn - 1));

    for (let i = startline + 1; i < endline; i += 1) {
      result.push(localSourceLines[i - 1]);
    }

    result.push(localSourceLines[endline - 1].slice(0, endcolumn));
  }

  return result.map(line => (keepWhitespaces ? line : line.trim())).join('\n').trim();
};
