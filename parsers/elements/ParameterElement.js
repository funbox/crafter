const Refract = require('../../Refract');
const utils = require('../../utils');

class ParameterElement {
  constructor(name, value, type, typeAttributes, description) {
    const resolvedType = utils.resolveType(type);

    this.name = name;
    this.value = value;
    this.rawType = type;
    this.type = resolvedType.type;
    this.typeAttributes = typeAttributes;
    this.description = description;
    this.defaultValue = null;
    this.enumerations = null;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: Refract.elements.string,
          content: this.name,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) },
          } : {}),
        },
        value: {},
      },
      attributes: {
        typeAttributes: {
          element: Refract.elements.array,
          content: [],
        },
      },
    };

    if (this.type === Refract.elements.enum) {
      result.content.value.element = Refract.elements.enum;
    }

    if (this.value) {
      const value = {
        element: Refract.elements.string,
        content: this.value,
        ...(this.sourceMap ? {
          attributes: { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) },
        } : {}),
      };

      result.content.value = this.type === Refract.elements.enum
        ? Object.assign({ content: value }, result.content.value) : value;
    }

    const typeAttributes = this.typeAttributes.length ? this.typeAttributes : ['required'];
    result.attributes.typeAttributes.content = typeAttributes.map(a => ({
      element: Refract.elements.string,
      content: a,
    }));

    if (this.description || this.rawType) {
      result.meta = {};
    }

    if (this.description) {
      result.meta.description = this.description.toRefract(sourceMapsEnabled);
    }

    if (this.rawType) {
      result.meta.title = {
        element: Refract.elements.string,
        content: this.rawType,
        ...(this.sourceMap ? {
          attributes: { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) },
        } : {}),
      };
    }

    if (this.defaultValue || this.enumerations) {
      if (!result.content.value.attributes) {
        result.content.value.attributes = {};
      }
    }

    if (this.defaultValue) {
      result.content.value.attributes.default = this.defaultValue.toRefract(sourceMapsEnabled);
    }

    if (this.enumerations) {
      result.content.value.attributes.enumerations = this.enumerations.toRefract(sourceMapsEnabled);
    }

    if (Object.keys(result.content.value).length === 0) {
      delete result.content.value;
    }

    return result;
  }
}

module.exports = ParameterElement;
