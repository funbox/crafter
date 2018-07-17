const utils = require('../../utils');
const types = require('../../types');

class ValueMemberElement {
  constructor(type, typeAttributes = [], example) {
    const resolvedType = utils.resolveType(type);

    this.type = resolvedType.type;
    this.propertyMembers = []; // array of PropertyMemberElement

    if (this.isArray()) {
      this.valueMembers = resolvedType.nestedTypes.map(t => new ValueMemberElement(t)); // array of ValueMemberElement
    }

    this.typeAttributes = typeAttributes;
    this.example = example;
  }

  isObject() {
    return !types.nonObjectTypes.includes(this.type);
  }

  isArray() {
    return this.type === types.array;
  }

  toRefract() {
    const type = this.type || (this.propertyMembers.length ? 'object' : 'string');

    const result = {
      element: type,
    };

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (this.example) {
      result.content = this.example;
    }

    if (this.propertyMembers.length) {
      result.content = this.propertyMembers.map(element => element.toRefract());
    } else if (this.valueMembers && this.valueMembers.length) {
      result.content = this.valueMembers.map(element => element.toRefract());
    }

    return result;
  }
}

module.exports = ValueMemberElement;
