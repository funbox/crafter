module.exports = function getSourcePosZeroBased(node) {
  const targetNode = getNodeWithSourcePos(node);
  return {
    startLineIndex: targetNode.sourcepos[0][0] - 1,
    startColumnIndex: targetNode.sourcepos[0][1] - 1,
    endLineIndex: targetNode.sourcepos[1][0] - 1,
    endColumnIndex: targetNode.sourcepos[1][1] - 1,
  };
};

function getNodeWithSourcePos(node) {
  return node.sourcepos ? node : getNodeWithSourcePos(node.parent);
}
