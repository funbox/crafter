const commonmark = require('@funbox/commonmark');
const equal = require('fast-deep-equal');

const DescriptionElement = require('./parsers/elements/DescriptionElement');
const StringElement = require('./parsers/elements/StringElement');
const HeadersElement = require('./parsers/elements/HeadersElement');
const Flags = require('./Flags');
const utilsHelpers = require('./utils/index.js');

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

const utils = {
  headerText(node, sourceLines) {
    return utilsHelpers.nodeText(node, sourceLines).slice(node.level).trim();
  },

  headerTextWithOffset(node, sourceLines) {
    const text = utilsHelpers.nodeText(node, sourceLines).slice(node.level);
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
      description += utilsHelpers.nodeText(curNode, sourceLines);
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



  getSourcePosZeroBased(node) {
    return {
      startLineIndex: node.sourcepos[0][0] - 1,
      startColumnIndex: node.sourcepos[0][1] - 1,
      endLineIndex: node.sourcepos[1][0] - 1,
      endColumnIndex: node.sourcepos[1][1] - 1,
    };
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
    const merged = new StringElement(first.string + second.string);
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

  CrafterError,

  SignatureError,

  Logger,

  linefeedBytes: 1,
};

function getEndingLinefeedLengthInBytes(lineIndex, sourceLines) {
  if (lineIndex < sourceLines.length - 1) {
    return utils.linefeedBytes;
  }
  return 0;
}

module.exports = utils;
