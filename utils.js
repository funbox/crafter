const commonmark = require('commonmark');
const Refract = require('./Refract');
const types = require('./types');
const SourceMapElement = require('./parsers/elements/SourceMapElement');
const DescriptionElement = require('./parsers/elements/DescriptionElement');

class CrafterError extends Error {
}

class Logger {
  constructor() {
    this.warningsEnabled = true;
  }

  warn(text) {
    if (this.warningsEnabled) {
      console.log('\x1b[33m%s\x1b[0m', `Warning: ${text}`); // yellow color
    }
  }

  enableWarnings() {
    this.warningsEnabled = true;
  }

  suppressWarnings() {
    this.warningsEnabled = false;
  }
}

const utils = {
  typeAttributesToRefract(typeAttributes) {
    return {
      typeAttributes: {
        element: Refract.elements.array,
        content: typeAttributes.map(a => ({
          element: Refract.elements.string,
          content: a,
        })),
      },
    };
  },

  headerText(node, sourceLines) {
    return this.nodeText(node, sourceLines).slice(node.level).trim();
  },

  extractDescription(curNode, sourceLines, sourceMapsEnabled, stopCallback, startOffset) {
    const startNode = curNode;
    let description = '';
    let descriptionEl = null;

    while (curNode && (curNode.type === 'paragraph' || stopCallback)) {
      if (stopCallback && stopCallback(curNode)) {
        break;
      }
      if (description) {
        description = this.appendDescriptionDelimiter(description);
      }
      description += this.nodeText(curNode, sourceLines);
      if (startOffset) {
        description = description.slice(startOffset);
        startOffset = 0;
      }
      curNode = this.nextNode(curNode);
    }

    if (description) {
      descriptionEl = new DescriptionElement(description);
      if (sourceMapsEnabled) {
        descriptionEl.sourceMap = this.makeSourceMapForDescription(startNode, sourceLines, stopCallback);
      }
    }

    return [curNode, descriptionEl];
  },

  getOffsetFromStartOfFileInBytes(lineIndex, columnIndex, sourceLines) {
    let result = 0;
    for (let i = 0; i < lineIndex; i += 1) {
      const str = sourceLines[i];
      result += Buffer.byteLength(str);
      result += getEndingLinefeedLengthInBytes(i, sourceLines);
    }
    const str = sourceLines[lineIndex].substring(0, columnIndex);
    result += Buffer.byteLength(str);
    return result;
  },

  makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines) {
    const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(startNode);
    const { endLineIndex, endColumnIndex } = utils.getSourcePosZeroBased(endNode);
    const startOffset = this.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
    const endOffset = this.getOffsetFromStartOfFileInBytes(endLineIndex, endColumnIndex + 1, sourceLines);
    let length = endOffset - startOffset;
    length += getEndingLinefeedLengthInBytes(endLineIndex, sourceLines);
    if (endNode.next) {
      length += getTrailingEmptyLinesLengthInBytes(endLineIndex + 1, sourceLines);
    }
    const byteBlock = { offset: startOffset, length };
    return new SourceMapElement([byteBlock], startNode.file);
  },

  makeGenericSourceMap(node, sourceLines) {
    return this.makeGenericSourceMapFromStartAndEndNodes(node, node, sourceLines);
  },

  makeSourceMapForDescription(startNode, sourceLines, stopCallback) {
    const indentation = startNode.sourcepos[0][1] - 1;
    if (indentation > 0) {
      return makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, stopCallback);
    }

    let endNode = startNode;
    while (endNode.next && endNode.next.type === 'paragraph') {
      endNode = endNode.next;
    }
    return this.makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines);
  },

  makeSourceMapForLine(node, sourceLines) {
    const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(node);
    const lineIndex = startLineIndex;
    const indentation = node.sourcepos[0][1] - 1;

    const offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
    const byteBlock = { offset, length: 0 };
    const line = sourceLines[lineIndex];
    const lineWithoutIndentation = line.slice(indentation);

    let length = Buffer.byteLength(lineWithoutIndentation);
    length += getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
    byteBlock.length += length;

    return new SourceMapElement([byteBlock], node.file);
  },

  makeSourceMapForAsset(node, context) {
    const byteBlocks = [];
    const { startLineIndex, startColumnIndex, endLineIndex } = this.getSourcePosZeroBased(node);
    const numSpacesPerIndentLevel = 4;
    const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
    let offset = this.getOffsetFromStartOfFileInBytes(startLineIndex, indentation, context.sourceLines);
    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
      const line = context.sourceLines[lineIndex];
      if (/\S/.test(line)) {
        const lineWithoutIndentation = line.slice(indentation);
        let length = Buffer.byteLength(lineWithoutIndentation);
        if (lineIndex < context.sourceLines.length - 1) {
          length += this.linefeedBytes;
        }
        byteBlocks.push({ offset, length });
        offset += length;
        offset += indentation;
      } else {
        offset += Buffer.byteLength(line) + this.linefeedBytes;
      }
    }

    return new SourceMapElement(byteBlocks, node.file);
  },

  getSourcePosZeroBased(node) {
    return {
      startLineIndex: node.sourcepos[0][0] - 1,
      startColumnIndex: node.sourcepos[0][1] - 1,
      endLineIndex: node.sourcepos[1][0] - 1,
      endColumnIndex: node.sourcepos[1][1] - 1,
    };
  },

  nodeText(node, sourceLines) {
    if (!node) {
      return '';
    }

    const localSourceLines = node.sourceLines || sourceLines;
    const [startline, startcolumn] = node.sourcepos[0];
    const [endline, endcolumn] = node.sourcepos[1];

    const result = [];

    if (startline === endline) {
      result.push(localSourceLines[startline - 1].slice(startcolumn - 1, endcolumn));
    } else {
      result.push(localSourceLines[startline - 1].slice(startcolumn - 1));

      for (let i = startline + 1; i < endline; i += 1) {
        result.push(localSourceLines[i - 1]);
      }

      result.push(localSourceLines[endline - 1].slice(0, endcolumn));
    }

    return result.map(line => line.trim()).join('\n').trim();
  },

  nextNode(node) {
    if (node.next) {
      const result = node.next;

      if (result) {
        if (result.type === 'list') {
          return result.firstChild || this.nextNode(result);
        }
        return result;
      }
    }

    if (!node.parent) {
      return null;
    }

    return this.nextNode(node.parent);
  },

  resolveType(type) {
    const result = {};

    const matchData = /^(array|enum)\s*(\[(.*)])?$/.exec(type);

    if (matchData) {
      const resolvedType = matchData[1];
      result.type = types[resolvedType];
      if (matchData[3]) {
        result.nestedTypes = matchData[3].split(',').map(rawType => rawType.trim()).filter(t => !!t);
      } else {
        result.nestedTypes = [];
      }
    } else {
      result.type = type;
      result.nestedTypes = [];
    }

    return result;
  },

  compareAttributeTypes(baseAttr, childAttr) {
    const baseType = baseAttr.type;

    switch (baseType) {
      case 'number':
        if (childAttr.type) return true; // если для enumMember задан свой тип, то всё ок
        if (Number.isNaN(Number(childAttr.name))) return false;
        break;
      default:
        return true;
    }

    return true;
  },

  markdownSourceToAST(source) {
    const parser = new commonmark.Parser({ sourcepos: true });
    const ast = parser.parse(source);

    return ast;
  },

  appendDescriptionDelimiter(s) {
    if (s[s.length - 1] !== '\n') {
      s += '\n';
    }
    if (s[s.length - 2] !== '\n') {
      s += '\n';
    }

    return s;
  },

  mergeSchemas(schema1, schema2) {
    const propsToMerge = ['properties', 'oneOf', 'required'];
    const result = { ...schema1 };
    Object.keys(schema2).forEach(key => {
      if ((key in result) && propsToMerge.includes(key)) {
        if (Array.isArray(result[key])) {
          result[key] = [
            ...result[key],
            ...schema2[key],
          ];
        } else {
          result[key] = {
            ...result[key],
            ...schema2[key],
          };
        }
      } else {
        result[key] = schema2[key];
      }
    });
    return result;
  },

  isCurrentNodeOrChild(node, rootNode) {
    while (node) {
      if (node === rootNode) {
        return true;
      }

      node = node.parent;
    }

    return false;
  },

  CrafterError,

  Logger,

  linefeedBytes: 1,
};

function getEndingLinefeedLengthInBytes(lineIndex, sourceLines) {
  if (lineIndex < sourceLines.length - 1) {
    return utils.linefeedBytes;
  }
  return 0;
}

function getTrailingEmptyLinesLengthInBytes(lineIndex, sourceLines) {
  let result = 0;
  for (let i = lineIndex; i < sourceLines.length && !/\S/.test(sourceLines[i]); i += 1) {
    result += sourceLines[i].length;
    result += getEndingLinefeedLengthInBytes(lineIndex, sourceLines);
  }
  return result;
}

function makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, stopCallback) {
  const byteBlocks = [];
  const iterationCondition = (node) => (stopCallback ? !stopCallback(node) : (node && node.type === 'paragraph'));
  for (let node = startNode; iterationCondition(node); node = utils.nextNode(node)) {
    const zeroBasedSourcePos = utils.getSourcePosZeroBased(node);
    let { startLineIndex } = zeroBasedSourcePos;
    const { startColumnIndex, endLineIndex } = zeroBasedSourcePos;
    if (node.skipLines) {
      startLineIndex += node.skipLines;
    }
    let offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
    const indentation = node.sourcepos[0][1] - 1;
    let byteBlock = { offset, length: 0 };
    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
      const line = sourceLines[lineIndex];
      let leadingSpaces = line.search(/\S/);
      leadingSpaces = leadingSpaces < 0 ? 0 : leadingSpaces;
      const lineIndentation = leadingSpaces - indentation;
      const unpaddedLine = line.trim();
      const length = Buffer.byteLength(unpaddedLine) + utils.linefeedBytes;
      byteBlock.length += length;
      byteBlock.offset += lineIndentation;
      offset += length + lineIndentation;
      if (lineIndex !== endLineIndex) {
        byteBlocks.push(byteBlock);
        offset += indentation;
        byteBlock = { offset, length: 0 };
      }
    }
    if (node.next && node.next.type === 'paragraph') {
      byteBlock.length += utils.linefeedBytes;
    }
    byteBlocks.push(byteBlock);
  }
  return new SourceMapElement(byteBlocks, startNode.file);
}

module.exports = utils;
