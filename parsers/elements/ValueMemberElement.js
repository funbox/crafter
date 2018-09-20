const Refract = require('../../Refract');
const utils = require('../../utils');
const types = require('../../types');
const ArrayElement = require('./ArrayElement');

class ValueMemberElement {
  constructor(type, typeAttributes = [], example, description) {
    const resolvedType = utils.resolveType(type);

    this.rawType = type;
    this.type = resolvedType.type;
    this.typeAttributes = typeAttributes;
    this.example = example;
    this.description = description;
    this.content = null;
    this.samples = null;

    if (this.isArray()) {
      const resolvedType = utils.resolveType(type);
      const valueMembers = resolvedType.nestedTypes.map(t => new ValueMemberElement(t));
      this.content = new ArrayElement(valueMembers);
    }
  }

  isObject() {
    return !types.nonObjectTypes.includes(this.type);
  }

  isArray() {
    return this.type === types.array;
  }

  isEnum() {
    return this.type === types.enum;
  }

  isComplex() {
    return !types.primitiveTypes.includes(this.type);
  }

  toRefract() {
    const type = this.type || (this.content ? 'object' : 'string');

    const result = {
      element: type,
    };

    if (this.description && !this.isObject()) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
        },
      };
    }

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (this.samples) {
      if (!result.attributes) result.attributes = {};

      result.attributes.samples = {
        element: Refract.elements.array,
        content: this.samples.toRefract().map(value => ({
          element: type,
          content: value,
        })),
      };
    }

    if (this.example) {
      result.content = this.example;
    }

    if (this.content) {
      if (this.isEnum()) {
        result.attributes = this.content.toRefract();
      } else {
        result.content = this.content.toRefract();
      }
    }

    if (!result.content || !result.content[0]) {
      delete result.content;
    }

    return result;
  }
}

module.exports = ValueMemberElement;
