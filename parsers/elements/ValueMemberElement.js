const utils = require('../../utils');
const types = require('../../types');

class ValueMemberElement {
  constructor(type, typeAttributes = [], example) {
    const resolvedType = resolveType(type);

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

function resolveType(type) {
  const result = {};

  const arrayMachData = /^array\s*(\[(.*)])?$/.exec(type);
  if (arrayMachData) {
    result.type = types.array;
    if (arrayMachData[2]) {
      result.nestedTypes = arrayMachData[2].split(',').map(rawType => rawType.trim()).filter(t => !!t);
    } else {
      result.nestedTypes = [];
    }
  } else {
    result.type = type;
  }

  return result;
}

module.exports = ValueMemberElement;
