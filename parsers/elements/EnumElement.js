const Refract = require('../../Refract');
const utils = require('../../utils');

class EnumElement {
  constructor(type) {
    const resolvedType = utils.resolveType(type);

    this.members = [];
    this.defaultValue = null;
    this.sampleValue = null;
    this.type = (resolvedType.nestedTypes[0] ? resolvedType.nestedTypes[0] : 'string');
  }

  toRefract() {
    const result = {
      enumerations: {
        element: Refract.elements.array,
        content: this.members.map(e => e.toRefract()),
      },
    };

    if (this.defaultValue) {
      result.default = {
        element: Refract.elements.enum,
        content: this.defaultValue.toRefract(),
      };
    }

    if (this.sampleValue) {
      result.samples = {
        element: Refract.elements.array,
        content: this.sampleValue.toRefract().map(value => ({
          element: Refract.elements.enum,
          content: value,
        })),
      };
    }
    return result;
  }

  getSchema() {
    const schema = {
      type: this.type,
      enum: this.members.map(member => member.name),
    };
    if (this.defaultValue) {
      schema.default = this.defaultValue.value;
    }
    return schema;
  }
}

module.exports = EnumElement;
