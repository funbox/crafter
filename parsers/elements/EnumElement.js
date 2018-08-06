const Refract = require('../../Refract');

class EnumElement {
  constructor() {
    this.members = [];
    this.defaultValue = null;
    this.sampleValue = null;
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
        content: [{
          element: Refract.elements.enum,
          content: this.sampleValue.toRefract(),
        }],
      };
    }
    return result;
  }
}

module.exports = EnumElement;
