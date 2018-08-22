const Refract = require('../../Refract');

class OneOfTypeElement {
  constructor() {
    this.options = [];
  }

  toRefract() {
    return {
      element: Refract.elements.select,
      content: this.options.map(option => option.toRefract()),
    };
  }
}

module.exports = OneOfTypeElement;
