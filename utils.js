const commonmark = require('commonmark');
const Refract = require('./Refract');
const types = require('./types');
const SourceMapElement = require('./parsers/elements/SourceMapElement');
const DescriptionElement = require('./parsers/elements/DescriptionElement');

class CrafterError extends Error {
}

const logger = {
  warn(text) {
    console.log('\x1b[33m%s\x1b[0m', `Warning: ${text}`); // yellow color
  },
};

module.exports = {
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

  extractDescription(curNode, sourceLines, sourceMapsEnabled) {
    const startNode = curNode;
    let description = '';
    let descriptionEl = null;

    while (curNode && curNode.type === 'paragraph') {
      if (description) {
        description = this.appendDescriptionDelimiter(description);
      }
      description += this.nodeText(curNode, sourceLines);
      curNode = this.nextNode(curNode);
    }

    if (description) {
      descriptionEl = new DescriptionElement(description);
      if (sourceMapsEnabled) {
        descriptionEl.sourceMap = this.makeSourceMapForDescription(startNode, sourceLines);
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
    const startLineIndex = startNode.sourcepos[0][0] - 1;
    const startColumnIndex = startNode.sourcepos[0][1] - 1;
    const endLineIndex = endNode.sourcepos[1][0] - 1;
    const endColumnIndex = endNode.sourcepos[1][1] - 1;
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

  makeSourceMapForDescription(startNode, sourceLines) {
    const indentation = startNode.sourcepos[0][1] - 1;
    const lineFeedByte = 1;
    const byteBlocks = [];
    let byteBlock = { offset: 0, length: 0 };
    let isFirstParagraph = true;
    for (let node = startNode; node && node.type === 'paragraph'; node = node.next) {
      const startLineIndex = node.sourcepos[0][0] - 1;
      const startColumnIndex = node.sourcepos[0][1] - 1;
      const endLineIndex = node.sourcepos[1][0] - 1;
      let offset = this.getOffsetFromStartOfFileInBytes(startLineIndex, startColumnIndex, sourceLines);
      if (isFirstParagraph || indentation > 0) {
        isFirstParagraph = false;
        byteBlock.offset = offset;
      }
      for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
        const line = sourceLines[lineIndex];
        const lineWithoutIndentation = line.slice(indentation);
        const length = Buffer.byteLength(lineWithoutIndentation) + lineFeedByte;
        byteBlock.length += length;
        offset += length;
        if (indentation > 0 && lineIndex !== endLineIndex) {
          byteBlocks.push(byteBlock);
          offset += indentation;
          byteBlock = { offset, length: 0 };
        }
      }
      if (indentation === 0) {
        byteBlock.length += getTrailingEmptyLinesLengthInBytes(endLineIndex + 1, sourceLines);
      } else if (node.next && node.next.type === 'paragraph') {
        byteBlock.length += 1;
      }
      if (indentation > 0) {
        byteBlocks.push(byteBlock);
        byteBlock = { offset: 0, length: 0 };
      }
    }
    if (indentation === 0) {
      byteBlocks.push(byteBlock);
    }
    return new SourceMapElement(byteBlocks, startNode.file);
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

  CrafterError,

  logger,
};

function getEndingLinefeedLengthInBytes(lineIndex, sourceLines) {
  if (lineIndex < sourceLines.length - 1) {
    return 1;
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
