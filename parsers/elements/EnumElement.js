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

    if (this.sampleValues) {
      result.samples = {
        element: Refract.elements.array,
        content: this.sampleValues.map(sampleElement => sampleElement.toRefract()),
      };
    }
    return result;
  }

  getBody() {
    const body = {};
    if (this.defaultValue) {
      body.value = this.defaultValue.value;
      return body;
    }
    if (this.members.length) {
      body.value = this.members[0].name;
      return body;
    }
    if (this.sampleValues) {
      const sampleBodyVariants = this.sampleValues[0].getBody();
      if (sampleBodyVariants.length) {
        body.value = sampleBodyVariants[0];
        return body;
      }
    }
    return body;
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
