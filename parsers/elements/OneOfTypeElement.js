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

  getSchema(resolvedTypes, flags = {}) {
    return {
      oneOf: this.options.map(option => option.getSchema(resolvedTypes, flags)),
    };
  }
}

module.exports = OneOfTypeElement;
