const commonmark = require('@funbox/commonmark');
const equal = require('fast-deep-equal');
const Refract = require('./Refract');
const types = require('./types');
const DescriptionElement = require('./parsers/elements/DescriptionElement');
const StringElement = require('./parsers/elements/StringElement');
const HeadersElement = require('./parsers/elements/HeadersElement');
const Flags = require('./Flags');

class CrafterError extends Error {
  constructor(message, sourceMap) {
    super(message);
    this.sourceMap = sourceMap;
  }
}

class SignatureError extends Error {}

class Logger {
  warn(text, details) {
    const [linePos, currentFile] = details;
    const positionText = linePos ? ` at line ${linePos}` : '';
    const fileText = currentFile ? ` (see ${currentFile})` : '';
    console.error('\x1b[33m%s\x1b[0m', `Warning${positionText}${fileText}: ${text}`); // yellow color
  }
}

class SourceMap {
  constructor(byteBlocks, charBlocks) {
    this.byteBlocks = byteBlocks;
    this.charBlocks = charBlocks;
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

  headerTextWithOffset(node, sourceLines) {
    const text = this.nodeText(node, sourceLines).slice(node.level);
    const trimmedText = text.trim();
    return [trimmedText, text ? node.level + text.indexOf(trimmedText) : undefined];
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
    if (startNode.file !== endNode.file) {
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
    const byteBlock = { offset: startOffset, length, file: startNode.file };
    const byteBlocks = [byteBlock];
    const charBlocks = this.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
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
    byteBlock.file = node.file;

    const byteBlocks = [byteBlock];
    const charBlocks = this.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
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
        byteBlocks.push({ offset, length, file: node.file });
        offset += length;
        offset += indentation;
      } else {
        offset += Buffer.byteLength(line) + this.linefeedBytes;
      }
    }

    const charBlocks = this.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
  },

  makeSourceMapsForInlineValues(value, inlineValues, node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(node);

    let lineStr = sourceLines[startLineIndex].slice(startColumnIndex);
    let columnIndex = startColumnIndex + lineStr.indexOf(value);
    lineStr = lineStr.slice(lineStr.indexOf(value));

    return inlineValues.map(inlineValue => {
      const inlineValueStr = String(inlineValue);
      columnIndex += lineStr.indexOf(inlineValueStr);
      lineStr = lineStr.slice(lineStr.indexOf(inlineValueStr));
      const byteBlock = {
        offset: utils.getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex, sourceLines),
        length: Buffer.byteLength(inlineValueStr),
        file: node.file,
      };
      lineStr = lineStr.slice(inlineValueStr.length);
      columnIndex += inlineValueStr.length;
      const byteBlocks = [byteBlock];
      const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
      return new SourceMap(byteBlocks, charBlocks);
    });
  },

  makeSourceMapsForString(str, offset, node, sourceLines, sourceBuffer, linefeedOffsets) {
    return utils.makeSourceMapsForStartPosAndLength(offset, str.length, node, sourceLines, sourceBuffer, linefeedOffsets);
  },

  makeSourceMapsForStartPosAndLength(startPos, length, node, sourceLines, sourceBuffer, linefeedOffsets) {
    sourceLines = node.sourceLines || sourceLines;
    sourceBuffer = node.sourceBuffer || sourceBuffer;
    linefeedOffsets = node.linefeedOffsets || linefeedOffsets;
    const { startLineIndex, startColumnIndex } = utils.getSourcePosZeroBased(node);

    const columnIndex = startColumnIndex + startPos;

    const offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex, sourceLines);
    const lengthInBytes = utils.getOffsetFromStartOfFileInBytes(startLineIndex, columnIndex + length, sourceLines) - offset;
    const byteBlock = {
      offset,
      length: lengthInBytes,
      file: node.file,
    };
    const byteBlocks = [byteBlock];
    const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
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
    const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
    return new SourceMap(byteBlocks, charBlocks);
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
    const keepWhitespaces = node.type === 'code_block' || node.type === 'item';

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
      nestedTypesOffsets: [],
    };

    if (!type) return result;

    const matchData = /^(.*?)\s*(\[(.*)])?$/.exec(type);
    const resolvedType = matchData[1];
    result.type = types[resolvedType] || resolvedType;
    if (matchData[3]) {
      let currentOffset = type.indexOf(matchData[3]);
      matchData[3].split(',').forEach(rawType => {
        const trimmedType = rawType.trim();
        if (trimmedType) {
          result.nestedTypes.push(trimmedType);
          result.nestedTypesOffsets.push(currentOffset + rawType.indexOf(trimmedType));
        }
        currentOffset += rawType.length;
      });
    }

    return result;
  },

  compareAttributeTypes(baseAttr, childAttr) {
    const baseType = baseAttr.type;

    switch (baseType) {
      case 'number':
        if (childAttr.type) return true; // если для enumMember задан свой тип, то всё ок
        if (Number.isNaN(Number(childAttr.value))) return false;
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
    const typeElementAttributes = typeElement.typeAttributes || [];
    const typeElementPropagatedAttributes = typeElement.propagatedTypeAttributes || [];

    return new Flags({
      isFixed: baseFlags.isFixed || typeElementAttributes.includes('fixed') || typeElementPropagatedAttributes.includes('fixed'),
      isFixedType: (options.propagateFixedType && baseFlags.isFixedType) || typeElementAttributes.includes('fixedType') || typeElementPropagatedAttributes.includes('fixedType'),
      isNullable: typeElementAttributes.includes('nullable'),
      skipTypesInlining: baseFlags.skipTypesInlining,
    });
  },

  mergeStringElements(first, second) {
    const merged = new StringElement();
    merged.string = first.string + second.string;
    if (first.sourceMap && second.sourceMap) {
      merged.sourceMap = utils.concatSourceMaps([first.sourceMap, second.sourceMap]);
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
    if (value === undefined || value === null) return { valid: false, value };

    switch (requiredType) {
      case 'number':
        if (Number.isNaN(Number(value))) {
          return { valid: false, value };
        }
        return { valid: true, value: Number(value) };
      case 'boolean':
        if (!['true', 'false'].includes(value)) {
          return { valid: false, value };
        }
        return { valid: true, value: (value === 'true') };
      case 'string':
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

  typeIsUsedByElement(typeName, typeElement, dataTypes) {
    if (typeElement.nestedTypes && typeElement.nestedTypes.find(({ type }) => type === typeName)) return true;

    const propertyMembers = typeElement.content && typeElement.content.propertyMembers;
    if (!propertyMembers) {
      return false;
    }

    return propertyMembers.some(pm => pm.value && (
      pm.value.type === typeName
      || dataTypes[pm.value.type] && this.typeIsUsedByElement(typeName, dataTypes[pm.value.type], dataTypes)
      || this.typeIsUsedByElement(typeName, pm.value, dataTypes)
    ));
  },

  typeIsReferred(typeName, schema) {
    return Object.entries(schema).some(([key, value]) => {
      if (key === '$ref' && value === `#/definitions/${typeName}`) return true;

      if (typeof value === 'object' && value !== null) {
        return this.typeIsReferred(typeName, value);
      }

      return false;
    });
  },

  mergeHeadersSections(headersSections) {
    return headersSections.reduce((result, headersSection) => {
      result.headers.push(...headersSection.headers);
      result.sourceMap = result.sourceMap
        ? this.concatSourceMaps([result.sourceMap, headersSection.sourceMap])
        : headersSection.sourceMap;
      return result;
    }, new HeadersElement([], null));
  },

  matchStringToRegex(str, re) {
    const matchData = re.exec(str);

    if (!matchData) {
      return matchData;
    }

    const locations = [];
    let lastLocation = matchData.index;
    for (let i = 0; i < matchData.length; i++) {
      if (matchData[i]) {
        lastLocation = str.indexOf(matchData[i], lastLocation);
        locations.push(lastLocation);
      } else {
        locations.push(undefined);
      }
    }

    return [matchData, locations];
  },

  makeStringElement(str, offset, node, context) {
    const sourceMap = utils.makeSourceMapsForString(
      str,
      offset,
      node,
      context.sourceLines,
      context.sourceBuffer,
      context.linefeedOffsets,
    );
    return new StringElement(str, sourceMap);
  },

  buildPrototypeElements(protoNames, protoNamesOffset, node, context) {
    const protoElements = [];

    if (protoNames) {
      let protoOffset = protoNamesOffset;
      const SEP = ',';
      protoNames.split(SEP).forEach(proto => {
        const trimmedProto = proto.trim();
        const protoElement = utils.makeStringElement(
          trimmedProto,
          protoOffset + proto.indexOf(trimmedProto),
          node,
          context,
        );
        protoElements.push(protoElement);
        protoOffset += proto.length + SEP.length;
      });
    }

    return protoElements;
  },

  preparePrototypes(rawPrototypes, context, sourceMap) {
    if (context.languageServerMode) {
      return rawPrototypes.filter(p => context.resourcePrototypeResolver.prototypes[p]);
    }

    rawPrototypes.forEach(prototype => {
      if (!context.resourcePrototypeResolver.prototypes[prototype]) {
        throw new utils.CrafterError(`Unknown resource prototype "${prototype}"`, sourceMap);
      }
    });

    return rawPrototypes;
  },

  splitTypeAttributes(typeAttrs) {
    const propertyAttributes = ['required', 'optional']; // see https://apielements.org/en/latest/element-definitions.html#member-element
    const propertyTypeAttributes = [];
    const propertyTypeAttributesIndexes = [];
    const valueTypeAttributes = [];
    const valueTypeAttributesIndexes = [];

    typeAttrs.forEach((attr, index) => {
      if (propertyAttributes.includes(attr)) {
        propertyTypeAttributes.push(attr);
        propertyTypeAttributesIndexes.push(index);
      } else {
        valueTypeAttributes.push(attr);
        valueTypeAttributesIndexes.push(index);
      }
    });
    return [propertyTypeAttributes, valueTypeAttributes, propertyTypeAttributesIndexes, valueTypeAttributesIndexes];
  },

  CrafterError,

  SignatureError,

  Logger,

  SourceMap,

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
      byteBlock.file = startNode.file;
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
  return new SourceMap(byteBlocks, charBlocks);
}

function byteBlockToCharacterBlock(byteBlock, sourceBuffer) {
  const charOffset = sourceBuffer.slice(0, byteBlock.offset).toString().length;
  const charLength = sourceBuffer.slice(byteBlock.offset, byteBlock.offset + byteBlock.length).toString().length;
  return { offset: charOffset, length: charLength, file: byteBlock.file };
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
