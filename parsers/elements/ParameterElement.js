const Refract = require('../../Refract');
const utils = require('../../utils');

class ParameterElement {
  constructor(name, example, type, typeAttributes, description) {
    const resolvedType = utils.resolveType(type);

    this.name = name;
    this.example = example;
    this.type = resolvedType.type;
    this.typeAttributes = typeAttributes;
    this.description = description;
    this.defaultValue = null;
    this.enumerations = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: Refract.elements.string,
          content: this.name,
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

    if (this.example) {
      const example = {
        element: Refract.elements.string,
        content: this.example,
      };

      result.content.value = this.type === Refract.elements.enum ?
        Object.assign({ content: example }, result.content.value) : example;
    }

    const typeAttributes = this.typeAttributes.length ? this.typeAttributes : ['required'];
    result.attributes.typeAttributes.content = typeAttributes.map(a => ({
      element: Refract.elements.string,
      content: a,
    }));

    if (this.description || this.type) {
      result.meta = {};
    }

    if (this.description) {
      result.meta.description = {
        element: Refract.elements.string,
        content: this.description,
      };
    }

    if (this.type) {
      result.meta.title = {
        element: Refract.elements.string,
        content: this.type,
      };
    }

    if (this.defaultValue || this.enumerations) {
      if (!result.content.value.attributes) {
        result.content.value.attributes = {};
      }
    }

    if (this.defaultValue) {
      result.content.value.attributes.default = this.defaultValue.toRefract();
    }

    if (this.enumerations) {
      result.content.value.attributes.enumerations = this.enumerations.toRefract();
    }

    if (Object.keys(result.content.value).length === 0) {
      delete result.content.value;
    }

    return result;
  }
}

module.exports = ParameterElement;
