const commonmark = require('commonmark');
const equal = require('fast-deep-equal');
const Refract = require('./Refract');
const types = require('./types');
const DescriptionElement = require('./parsers/elements/DescriptionElement');
const StringElement = require('./parsers/elements/StringElement');

class CrafterError extends Error {
  constructor(message, sourceMap) {
    super(message);
    this.sourceMap = sourceMap;
  }
}

class Logger {
  warn(text, details) {
    const [linePos, currentFile] = details;
    const positionText = linePos ? ` at line ${linePos}` : '';
    const fileText = currentFile ? ` (see ${currentFile})` : '';
    console.error('\x1b[33m%s\x1b[0m', `Warning${positionText}${fileText}: ${text}`); // yellow color
  }
}

const utils = {
  typeAttributesToRefract(typeAttributes) {
    return {
      typeAttributes: {
        element: Refract.elements.array,
        content: typeAttributes.map(a => {
          if (Array.isArray(a)) {
            return {
              element: Refract.elements.member,
              content: {
                key: {
                  element: Refract.elements.string,
                  content: a[0],
                },
                value: {
                  element: Refract.elements.string,
                  content: a[1],
                },
              },
            };
          }
          return {
            element: Refract.elements.string,
            content: a,
          };
        }),
      },
    };
  },

  headerText(node, sourceLines) {
    return this.nodeText(node, sourceLines).slice(node.level).trim();
  },

  extractDescription(curNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback, startOffset) {
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
      descriptionEl.sourceMap = this.makeSourceMapForDescription(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback);
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

  makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = startNode.sourceLines || sourceLines;
    sourceBuffer = startNode.sourceBuffer || sourceBuffer;
    linefeedOffsets = startNode.linefeedOffsets || linefeedOffsets;
    if (startNode.sourceLines && !endNode.sourceLines) {
      throw new CrafterError('startNode and endNode belong to different files');
    }
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
    const byteBlocks = [byteBlock];
    const charBlocks = this.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return { byteBlocks, charBlocks, file: startNode.file };
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
      !!node.next && (stopCallback ? !stopCallback(this.nextNode(node)) : node.next.type === 'paragraph')
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

    const byteBlocks = [byteBlock];
    const charBlocks = this.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return { byteBlocks, charBlocks, file: node.file };
  },

  makeSourceMapForAsset(node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const byteBlocks = [];
    const { startLineIndex, startColumnIndex, endLineIndex } = this.getSourcePosZeroBased(node);
    const numSpacesPerIndentLevel = 4;
    const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
    let offset = this.getOffsetFromStartOfFileInBytes(startLineIndex, indentation, sourceLines);
    for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
      const line = sourceLines[lineIndex];
      if (/\S/.test(line)) {
        const lineWithoutIndentation = line.slice(indentation);
        let length = Buffer.byteLength(lineWithoutIndentation);
        if (lineIndex < sourceLines.length - 1) {
          length += this.linefeedBytes;
        }
        byteBlocks.push({ offset, length });
        offset += length;
        offset += indentation;
      } else {
        offset += Buffer.byteLength(line) + this.linefeedBytes;
      }
    }

    const charBlocks = this.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return { byteBlocks, charBlocks, file: node.file };
  },

  getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets) {
    return byteBlocks.map(byteBlock => {
      const charBlock = byteBlockToCharacterBlock(byteBlock, sourceBuffer);
      const info = getLineColumnInfo(charBlock, linefeedOffsets);
      return { ...charBlock, ...info };
    });
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
    // commonmark incorrectly detects the end column of a fenced code block:
    // https://github.com/commonmark/commonmark.js/issues/141
    const fixedEndcolumn = node.type === 'code_block' ? localSourceLines[endline - 1].length : endcolumn;
    const keepWhitespaces = node.type === 'code_block';

    const result = [];

    if (startline === endline) {
      result.push(localSourceLines[startline - 1].slice(startcolumn - 1, endcolumn));
    } else {
      result.push(localSourceLines[startline - 1].slice(startcolumn - 1));

      for (let i = startline + 1; i < endline; i += 1) {
        result.push(localSourceLines[i - 1]);
      }

      result.push(localSourceLines[endline - 1].slice(0, fixedEndcolumn));
    }

    return result.map(line => (keepWhitespaces ? line : line.trim())).join('\n').trim();
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

  nextNodeOfType(node, type) {
    const result = this.nextNode(node);
    if (!result) return result;
    if (result.type === type) {
      return result;
    }
    return this.nextNodeOfType(result, type);
  },

  resolveType(type) {
    const result = {
      type,
      nestedTypes: [],
    };

    const matchData = /^(.*?)\s*(\[(.*)])?$/.exec(type);
    const resolvedType = matchData[1];
    result.type = types[resolvedType] || resolvedType;
    if (matchData[3]) {
      result.nestedTypes = matchData[3].split(',').map(rawType => rawType.trim()).filter(t => !!t);
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

  validateAttributesConsistency(context, result, attributeSignatureDetails, typeAttributes) {
    if (result.isArray() && result.typeAttributes.includes(typeAttributes['fixed-type'])) {
      context.addWarning('fixed-type keyword is redundant', attributeSignatureDetails.sourceMap);
      result.typeAttributes = result.typeAttributes.filter(x => x !== typeAttributes['fixed-type']);
    }

    const attributesRequiredTypeValue = {
      pattern: 'string',
      format: 'string',
      minimum: 'number',
      maximum: 'number',
    };

    const attributesToCheck = result.typeAttributes
      .filter(a => Array.isArray(a) && attributesRequiredTypeValue[a[0]] !== undefined)
      .map(a => a[0]);

    attributesToCheck.forEach(a => {
      if (!result.isType(attributesRequiredTypeValue[a])) {
        context.addWarning(`Attribute "${a}" can be used in ${attributesRequiredTypeValue[a]} value type only.`, attributeSignatureDetails.sourceMap);
      }
    });

    return [context, result];
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
    const uniquifySchemas = this.uniquifySchemas;
    const propsToMerge = [
      'enum',
      'properties',
      'oneOf',
      'required',
      { name: 'minItems', action(first, second) { return first + second; } },
      {
        name: 'items',
        action(first, second) {
          if (Array.isArray(first)) {
            return [
              ...first,
              ...second,
            ].filter((v, i, a) => a.indexOf(v) === i);
          }

          const schemaVariants = [
            ...(first.anyOf ? first.anyOf : [first]),
            ...(second.anyOf ? second.anyOf : [second]),
          ];

          const uniqueVariants = uniquifySchemas(schemaVariants);

          if (uniqueVariants.length === 1) {
            return uniqueVariants[0];
          }

          return {
            anyOf: uniqueVariants,
          };
        },
      },
    ];
    const result = { ...schema1 };
    Object.keys(schema2).forEach(key => {
      const foundProp = propsToMerge.find(prop => (prop === key || (prop.name && prop.name === key)));
      if ((key in result) && foundProp) {
        if (foundProp.action) {
          result[key] = foundProp.action(result[key], schema2[key]);
          return;
        }
        if (Array.isArray(result[key])) {
          result[key] = [
            ...result[key],
            ...schema2[key],
          ].filter((v, i, a) => a.indexOf(v) === i);
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

  uniquifySchemas(schemaVariants) {
    let primitiveVariants = [];
    const complexVariants = [];
    const equalTo = (item1) => (item2) => equal(item1, item2);

    schemaVariants.forEach(variant => {
      if (Object.keys(variant).length === 1 && variant.type) {
        primitiveVariants.push(variant.type);
        return;
      }
      if (!complexVariants.find(equalTo(variant))) {
        complexVariants.push(variant);
      }
    });

    primitiveVariants = primitiveVariants
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((v) => ({ type: v }));

    return primitiveVariants.concat(complexVariants);
  },

  mergeFlags(baseFlags, typeElement, options = { propagateFixedType: true }) {
    return {
      isFixed: baseFlags.isFixed || typeElement.typeAttributes.includes('fixed'),
      isFixedType: (options.propagateFixedType && baseFlags.isFixedType) || typeElement.typeAttributes.includes('fixedType'),
      isNullable: typeElement.typeAttributes.includes('nullable'),
    };
  },

  mergeStringElements(first, second) {
    const merged = new StringElement();
    merged.string = first.string + second.string;
    if (first.sourceMap && second.sourceMap) {
      merged.sourceMap = {};
      merged.sourceMap.byteBlocks = [...first.sourceMap.byteBlocks, ...second.sourceMap.byteBlocks];
      merged.sourceMap.charBlocks = [...first.sourceMap.charBlocks, ...second.sourceMap.charBlocks];
    }
    return merged;
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

  convertType(value, requiredType) {
    const isNumber = (v) => (typeof v === 'number' || v instanceof Number);
    const isString = (v) => (typeof v === 'string' || v instanceof String);
    const isBoolean = (v) => (typeof v === 'boolean' || v instanceof Boolean);

    if (value !== false && !value) return { valid: false, value };

    switch (requiredType) {
      case 'number':
        if (isNumber(value)) return { valid: true, value };
        if (Number.isNaN(Number(value))) {
          return { valid: false, value };
        }
        return { valid: true, value: Number(value) };
      case 'boolean':
        if (isBoolean(value)) return { valid: true, value };
        if (!['true', 'false'].includes(value)) {
          return { valid: false, value };
        }
        return { valid: true, value: (value === 'true') };
      case 'string':
        if (isString(value)) return { valid: true, value };
        return { valid: true, value: String(value) };
      default:
        return { valid: true, value };
    }
  },

  defaultValue(type) {
    const valueByType = {
      boolean: true,
      number: 1,
      string: 'hello',
      array: [],
      object: {},
      file: 'hello',
      enum: 'hello',
    };
    return valueByType[type] === undefined ? '' : valueByType[type];
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

function makeSourceMapForDescriptionWithIndentation(startNode, sourceLines, sourceBuffer, linefeedOffsets, stopCallback) {
  sourceLines = startNode.sourceLines || sourceLines;
  sourceBuffer = startNode.sourceBuffer || sourceBuffer;
  linefeedOffsets = startNode.linefeedOffsets || linefeedOffsets;
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
    if (byteBlock.length > 1) {
      byteBlocks.push(byteBlock);
    }
  }
  const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return { byteBlocks, charBlocks, file: startNode.file };
}

function byteBlockToCharacterBlock(byteBlock, sourceBuffer) {
  const charOffset = sourceBuffer.slice(0, byteBlock.offset).toString().length;
  const charLength = sourceBuffer.slice(byteBlock.offset, byteBlock.offset + byteBlock.length).toString().length;
  return { offset: charOffset, length: charLength };
}

function getLineColumnInfo(characterBlock, linefeedOffsets) {
  const startOffset = characterBlock.offset;
  const length = characterBlock.length;

  const startLinefeedIndex = linefeedOffsets.findIndex(linefeedOffset => linefeedOffset > startOffset);
  const startLine = startLinefeedIndex + 1;
  const startColumn = (startLinefeedIndex > 0) ? (startOffset - linefeedOffsets[startLinefeedIndex - 1]) : (startOffset + 1);

  const endOffset = (startOffset + length - 1);
  const endLinefeedIndex = linefeedOffsets.findIndex(linefeedOffset => linefeedOffset >= endOffset);
  const endLine = endLinefeedIndex + 1;
  const endColumn = (endLinefeedIndex > 0) ? (endOffset - linefeedOffsets[endLinefeedIndex - 1]) : (endOffset + 1);

  return { startLine, startColumn, endLine, endColumn };
}

module.exports = utils;
