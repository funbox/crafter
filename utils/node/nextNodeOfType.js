const nextNode = require('./nextNode');

module.exports = function nextNodeOfType(node, type) {
  const result = nextNode(node);
  if (!result) return result;
  if (result.type === type) {
    return result;
  }
  return nextNodeOfType(result, type);
};
