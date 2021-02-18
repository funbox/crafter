const nodeText = require('./nodeText');

module.exports = function headerTextWithOffset(node, sourceLines) {
  const text = nodeText(node, sourceLines).slice(node.level);
  const trimmedText = text.trim();
  return [trimmedText, text ? node.level + text.indexOf(trimmedText) : undefined];
};
