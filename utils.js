const commonmark = require('@funbox/commonmark');

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
};

module.exports = utils;
