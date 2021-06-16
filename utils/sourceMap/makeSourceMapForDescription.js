const makeGenericSourceMapFromStartAndEndNodes = require('./makeGenericSourceMapFromStartAndEndNodes');
const { nextNode } = require('../node');
const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const { LINEFEED_BYTES } = require('../../constants');
const SourceMap = require('./SourceMap');
const ByteBlock = require('./ByteBlock');

module.exports = function makeSourceMapForDescription(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback) {
  const indentation = startNode.sourcepos[0][1] - 1;
  if (indentation > 0) {
    return makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback);
  }

  let endNode = startNode;
  const iterationCondition = (node) => (
    !!nextNode(node) && (stopCallback ? !stopCallback(nextNode(node)) : node.next.type === 'paragraph')
  );
  while (iterationCondition(endNode)) {
    endNode = nextNode(endNode);
  }

  return makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines, sourceBuffer, linefeedOffsets);
};

function makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback) {
  const byteBlocks = [];
  const iterationCondition = (node) => (stopCallback ? !stopCallback(node) : (node && node.type === 'paragraph'));
  for (let node = startNode; iterationCondition(node); node = nextNode(node)) {
    const zeroBasedSourcePos = getSourcePosZeroBased(node);
    let { startLineIndex } = zeroBasedSourcePos;
    const { startColumnIndex, endLineIndex } = zeroBasedSourcePos;
    if (node.skipLines) {
      startLineIndex += node.skipLines;
    }
    let offset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
    const indentation = startColumnIndex;
    let byteBlock = new ByteBlock(offset, 0, startNode.file);
    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
      const line = sourceLines[lineIndex];
      let leadingSpaces = line.search(/\S/);
      leadingSpaces = leadingSpaces < 0 ? 0 : leadingSpaces;
      const lineIndentation = leadingSpaces - indentation;
      const unpaddedLine = line.trim();
      const length = Buffer.byteLength(unpaddedLine) + LINEFEED_BYTES;
      byteBlock.length += length;
      byteBlock.offset += lineIndentation;
      offset += length + lineIndentation;
      if (lineIndex !== endLineIndex) {
        byteBlocks.push(byteBlock);
        offset += indentation;
        byteBlock = new ByteBlock(offset, 0, startNode.file);
      }
    }
    if (node.next && node.next.type === 'paragraph') {
      byteBlock.length += LINEFEED_BYTES;
    }
    if (byteBlock.length > 1) {
      byteBlocks.push(byteBlock);
    }
  }
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
}
