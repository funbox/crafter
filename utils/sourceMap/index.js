const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('../getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('../getSourcePosZeroBased');
const linefeedBytes = require('../linefeedBytes');
const nextNode = require('../nextNode');

class CrafterError extends Error {
  constructor(message, sourceMap) {
    super(message);
    this.sourceMap = sourceMap;
  }
}

class SourceMap {
  constructor(byteBlocks, charBlocks) {
    this.byteBlocks = byteBlocks;
    this.charBlocks = charBlocks;
  }
}

module.exports = {
  makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = startNode.sourceLines || sourceLines;
    sourceBuffer = startNode.sourceBuffer || sourceBuffer;
    linefeedOffsets = startNode.linefeedOffsets || linefeedOffsets;
    if (startNode.file !== endNode.file) {
      throw new CrafterError('startNode and endNode belong to different files');
    }
    const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(startNode);
    const { endLineIndex, endColumnIndex } = getSourcePosZeroBased(endNode);
    const startOffset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
    const endOffset = getOffsetFromStartOfFileInBytes(endLineIndex, endColumnIndex + 1, sourceLines);
    let length = endOffset - startOffset;
    length += getEndingLinefeedLengthInBytes(endLineIndex, sourceLines);
    if (endNode.next) {
      length += getTrailingEmptyLinesLengthInBytes(endLineIndex + 1, sourceLines);
    }
    const byteBlock = { offset: startOffset, length, file: startNode.file };
    const byteBlocks = [byteBlock];
    const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  },

  makeGenericSourceMap(node, sourceLines, sourceBuffer, linefeedOffsets) {
    return this.makeGenericSourceMapFromStartAndEndNodes(node, node, sourceLines, sourceBuffer, linefeedOffsets);
  },

  makeSourceMapForDescription(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback) {
    const indentation = startNode.sourcepos[0][1] - 1;
    if (indentation > 0) {
      return makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback);
    }

    let endNode = startNode;
    const iterationCondition = (node) => (
      !!node.next && (stopCallback ? !stopCallback(nextNode(node)) : node.next.type === 'paragraph')
    );
    while (iterationCondition(endNode)) {
      endNode = endNode.next;
    }
    return this.makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines, sourceBuffer, linefeedOffsets);
  },

  makeSourceMapForLine(node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);
    const lineIndex = startLineIndex;
    const indentation = node.sourcepos[0][1] - 1;

    const offset = getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
    const byteBlock = { offset, length: 0 };
    const line = sourceLines[lineIndex];
    const lineWithoutIndentation = line.slice(indentation);

    let length = Buffer.byteLength(lineWithoutIndentation);
    length += getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
    byteBlock.length += length;
    byteBlock.file = node.file;

    const byteBlocks = [byteBlock];
    const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  },

  makeSourceMapForAsset(node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const byteBlocks = [];
    const { startLineIndex, startColumnIndex, endLineIndex } = getSourcePosZeroBased(node);
    const numSpacesPerIndentLevel = 4;
    const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
    let offset = getOffsetFromStartOfFileInBytes(startLineIndex, indentation, sourceLines);
    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
      const line = sourceLines[lineIndex];
      if (/\S/.test(line)) {
        const lineWithoutIndentation = line.slice(indentation);
        let length = Buffer.byteLength(lineWithoutIndentation);
        if (lineIndex < sourceLines.length - 1) {
          length += linefeedBytes;
        }
        byteBlocks.push({ offset, length, file: node.file });
        offset += length;
        offset += indentation;
      } else {
        offset += Buffer.byteLength(line) + linefeedBytes;
      }
    }

    const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  },

  makeSourceMapsForInlineValues(value, inlineValues, node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);

    let lineStr = sourceLines[startLineIndex].slice(startColumnIndex);
    let columnIndex = startColumnIndex + lineStr.indexOf(value);
    lineStr = lineStr.slice(lineStr.indexOf(value));

    return inlineValues.map(inlineValue => {
      const inlineValueStr = String(inlineValue);
      columnIndex += lineStr.indexOf(inlineValueStr);
      lineStr = lineStr.slice(lineStr.indexOf(inlineValueStr));
      const byteBlock = {
        offset: getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex, sourceLines),
        length: Buffer.byteLength(inlineValueStr),
        file: node.file,
      };
      lineStr = lineStr.slice(inlineValueStr.length);
      columnIndex += inlineValueStr.length;
      const byteBlocks = [byteBlock];
      const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
      return new SourceMap(byteBlocks, charBlocks);
    });
  },

  makeSourceMapsForString(str, offset, node, sourceLines, sourceBuffer, linefeedOffsets) {
    return this.makeSourceMapsForStartPosAndLength(offset, str.length, node, sourceLines, sourceBuffer, linefeedOffsets);
  },

  makeSourceMapsForStartPosAndLength(startPos, length, node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const { startLineIndex, startColumnIndex } = getSourcePosZeroBased(node);

    const columnIndex = startColumnIndex + startPos;

    const offset = getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex, sourceLines);
    const lengthInBytes = getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex + length, sourceLines) - offset;
    const byteBlock = {
      offset,
      length: lengthInBytes,
      file: node.file,
    };
    const byteBlocks = [byteBlock];
    const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  },

  concatSourceMaps(sourceMaps) {
    const result = new SourceMap([], []);
    sourceMaps.forEach(sm => {
      result.byteBlocks.push(...sm.byteBlocks);
      result.charBlocks.push(...sm.charBlocks);
    });

    return result;
  },

  mergeSourceMaps(sourceMaps, sourceBuffer, linefeedOffsets) {
    let fileFetched = false;
    let file;
    let offset = Number.MAX_VALUE;

    sourceMaps.forEach(sm => {
      sm.byteBlocks.forEach(bb => {
        if (!fileFetched) {
          file = bb.file;
          fileFetched = true;
        } else if (file !== bb.file) {
          throw new CrafterError('Can not expand source maps from different files');
        }

        if (offset > bb.offset) {
          offset = bb.offset;
        }
      });
    });

    const byteBlock = {
      offset,
      length: -1,
      file,
    };

    sourceMaps.forEach(sm => {
      sm.byteBlocks.forEach(bb => {
        byteBlock.length = Math.max(byteBlock.length, bb.offset + bb.length - byteBlock.offset);
      });
    });

    const byteBlocks = [byteBlock];
    const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  },

  SourceMap,
};

function getTrailingEmptyLinesLengthInBytes(lineIndex, sourceLines) {
  let result = 0;
  for (let i = lineIndex; i < sourceLines.length && !/\S/.test(sourceLines[i]); i += 1) {
    result += sourceLines[i].length;
    result += getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
  }
  return result;
}

function makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback) {
  sourceLines = startNode.sourceLines || sourceLines;
  sourceBuffer = startNode.sourceBuffer || sourceBuffer;
  linefeedOffsets = startNode.linefeedOffsets || linefeedOffsets;
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
    const indentation = node.sourcepos[0][1] - 1;
    let byteBlock = { offset, length: 0 };
    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
      const line = sourceLines[lineIndex];
      let leadingSpaces = line.search(/\S/);
      leadingSpaces = leadingSpaces < 0 ? 0 : leadingSpaces;
      const lineIndentation = leadingSpaces - indentation;
      const unpaddedLine = line.trim();
      const length = Buffer.byteLength(unpaddedLine) + linefeedBytes;
      byteBlock.length += length;
      byteBlock.offset += lineIndentation;
      byteBlock.file = startNode.file;
      offset += length + lineIndentation;
      if (lineIndex !== endLineIndex) {
        byteBlocks.push(byteBlock);
        offset += indentation;
        byteBlock = { offset, length: 0 };
      }
    }
    if (node.next && node.next.type === 'paragraph') {
      byteBlock.length += linefeedBytes;
    }
    if (byteBlock.length > 1) {
      byteBlocks.push(byteBlock);
    }
  }
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
}

function getEndingLinefeedLengthInBytes(lineIndex, sourceLines) {
  if (lineIndex < sourceLines.length - 1) {
    return linefeedBytes;
  }
  return 0;
}
