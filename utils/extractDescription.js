const DescriptionElement = require('../parsers/elements/DescriptionElement');

const appendDescriptionDelimiter = require('./appendDescriptionDelimiter');
const nodeText = require('./nodeText');
const nextNode = require('./nextNode');
const utilsSourceMap = require('./sourceMap');

module.exports = function extractDescription(curNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback, startOffset) {
  const startNode = curNode;
  let description = '';
  let descriptionEl = null;

  while (curNode && (curNode.type === 'paragraph' || stopCallback)) {
    if (stopCallback && stopCallback(curNode)) {
      break;
    }
    if (description) {
      description = appendDescriptionDelimiter(description);
    }
    description += nodeText(curNode, sourceLines);
    if (startOffset) {
      description = description.slice(startOffset);
      startOffset = 0;
    }
    curNode = nextNode(curNode);
  }

  if (description) {
    descriptionEl = new DescriptionElement(description);
    descriptionEl.sourceMap = utilsSourceMap.makeSourceMapForDescription(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback);
  }

  return [curNode, descriptionEl];
};
