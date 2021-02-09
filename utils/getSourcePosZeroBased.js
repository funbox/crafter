module.exports = function getSourcePosZeroBased(node) {
  return {
    startLineIndex: node.sourcepos[0][0] - 1,
    startColumnIndex: node.sourcepos[0][1] - 1,
    endLineIndex: node.sourcepos[1][0] - 1,
    endColumnIndex: node.sourcepos[1][1] - 1,
  };
};
