module.exports = function isCurrentNodeOrChild(node, rootNode) {
  while (node) {
    if (node === rootNode) {
      return true;
    }

    node = node.parent;
  }

  return false;
};
