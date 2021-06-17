const DescriptionElement = require('../parsers/elements/DescriptionElement');

const appendDescriptionDelimiter = require('./appendDescriptionDelimiter');
const { nodeText, nextNode } = require('./node');
const getSourcePosZeroBased = require('./getSourcePosZeroBased');
const { makeSourceMapForDescription } = require('./sourceMap');

module.exports = function extractDescription(curNode, sourceLines, sourceBuffer, linefeedOffsets, currentFile, stopCallback, startOffset) {
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

    const { startLineIndex } = getSourcePosZeroBased(curNode);
    const startLineOffset = sourceLines[startLineIndex].search(/\S/);
    description += nodeText(curNode, sourceLines, getNodeTextFormatter(curNode, startLineOffset));

    if (startOffset) {
      description = description.slice(startOffset);
      startOffset = 0;
    }
    curNode = nextNode(curNode);
  }

  if (description) {
    descriptionEl = new DescriptionElement(description);
    descriptionEl.sourceMap = makeSourceMapForDescription(startNode, sourceLines, sourceBuffer, linefeedOffsets, currentFile, stopCallback);
  }

  return [curNode, descriptionEl];
};

function getNodeTextFormatter(node, startLineOffset) {
  // для вложенных списков и блоков кода в описании нужно сохранять отступы
  const keepWhitespaces = ['code_block', 'item'].includes(node.type);

  if (keepWhitespaces) {
    return (line) => {
      const spaceFromLeft = line.search(/\S/) - startLineOffset;
      return spaceFromLeft >= 0 ? line.replace(/^\s+/g, ''.padStart(spaceFromLeft)) : line;
    };
  }

  return (line) => line.trim();
}
