const Refract = require('../../Refract');
const utils = require('../../utils');

class EnumElement {
  constructor(type) {
    const resolvedType = utils.resolveType(type);

    this.members = [];
    this.defaultValue = null;
    this.sampleValues = null;
    this.type = (resolvedType.nestedTypes[0] ? resolvedType.nestedTypes[0] : 'string');
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      enumerations: {
        element: Refract.elements.array,
        content: this.members.map(e => e.toRefract(sourceMapsEnabled)),
      },
    };

    if (this.defaultValue) {
      result.default = this.defaultValue.toRefract(sourceMapsEnabled);
    }

    if (this.sampleValues) {
      result.samples = {
        element: Refract.elements.array,
        content: this.sampleValues.map(sampleElement => sampleElement.toRefract(sourceMapsEnabled)),
      };
    }
    return result;
  }

  getBody() {
    if (this.defaultValue) {
      return this.defaultValue.value;
    }

    if (this.members.length) {
      return this.members[0].name;
    }

    if (this.sampleValues) {
      return this.sampleValues[0].getBody();
    }

    return undefined;
  }

  getSchema() {
    const usedTypes = [];
    const schema = {
      type: this.type,
      enum: this.members.map(member => member.name),
    };
    if (this.defaultValue) {
      schema.default = this.defaultValue.value;
    }
    return [schema, usedTypes];
  }
}

module.exports = EnumElement;
