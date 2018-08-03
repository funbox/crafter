const utils = require('../../utils');
const types = require('../../types');
const ArrayElement = require('./ArrayElement');

class ValueMemberElement {
  constructor(type, typeAttributes = [], example) {
    const resolvedType = utils.resolveType(type);

    this.type = resolvedType.type;
    this.typeAttributes = typeAttributes;
    this.example = example;
    this.content = null;

    if (this.isArray()) {
      this.content = new ArrayElement(type);
    }
  }

  isObject() {
    return !types.nonObjectTypes.includes(this.type);
  }

  isArray() {
    return this.type === types.array;
  }

  toRefract() {
    const type = this.type || (this.content ? 'object' : 'string');

    const result = {
      element: type,
    };

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (this.example) {
      result.content = this.example;
    }

    if (this.content) {
      result.content = this.content.toRefract();
    }

    if (!result.content || !result.content[0]) {
      delete result.content;
    }

    return result;
  }
}

module.exports = ValueMemberElement;
