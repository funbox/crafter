const commonmark = require('@funbox/commonmark');

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
