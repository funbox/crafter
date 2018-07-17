const Refract = require('../../Refract');

class EnumElement {
  constructor() {
    this.members = [];
  }

  toRefract() {
    return {
      enumerations: {
        element: Refract.elements.array,
        content: this.members.map(e => e.toRefract()),
      },
    };
  }
}

module.exports = EnumElement;
