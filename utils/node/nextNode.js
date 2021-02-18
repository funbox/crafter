module.exports = function nextNode(node) {
  if (node.next) {
    const result = node.next;

    if (result) {
      if (result.type === 'list') {
        return result.firstChild || nextNode(result);
      }
      return result;
    }
  }

  if (!node.parent) {
    return null;
  }

  return nextNode(node.parent);
};
