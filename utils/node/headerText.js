const nodeText = require('./nodeText');

module.exports = function headerText(node, sourceLines) {
  return nodeText(node, sourceLines).slice(node.level).trim();
};
