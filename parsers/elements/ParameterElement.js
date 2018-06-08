const Refract = require('../../Refract');

class ParameterElement {
  constructor(name, example, type, typeAttributes, description) {
    this.name = name;
    this.example = example;
    this.type = type;
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
      },
    };

    if (this.example) {
      result.content.value = {
        element: Refract.elements.string,
        content: this.example,
      };
    }

    if (this.typeAttributes.length) {
      result.attributes = {
        typeAttributes: this.typeAttributes.map(a => ({
          element: Refract.elements.string,
          content: a
        }))
      };
    }

    if (this.description || this.type) {
      result.meta = {};
    }

    if (this.description) {
      result.meta.description = {
        element: Refract.elements.string,
        content: this.description
      };
    }

    if (this.type) {
      result.meta.title = {
        element: Refract.elements.string,
        content: this.type
      };
    }

    if (this.defaultValue || this.enumerations) {
      if (!result.content.value) {
        result.content.value = {};
      }

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

    return result;
  }
}

module.exports = ParameterElement;