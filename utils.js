const commonmark = require('@funbox/commonmark');

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

  nextNodeOfType(node, type) {
    const result = utilsHelpers.nextNode(node);
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

  CrafterError,

  SignatureError,

  Logger,
};

module.exports = utils;
