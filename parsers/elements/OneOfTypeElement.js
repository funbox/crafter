const Refract = require('../../Refract');

class OneOfTypeElement {
  constructor() {
    this.options = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.select,
      content: this.options.map(option => option.toRefract(sourceMapsEnabled)),
    };
  }

  getBody(resolvedTypes) {
    if (this.options.length) {
      return this.options[0].getBody(resolvedTypes);
    }

    return {};
  }

  getSchema(resolvedTypes, flags = {}) {
    return {
      oneOf: this.options.map(option => option.getSchema(resolvedTypes, flags)),
    };
  }
}

module.exports = OneOfTypeElement;
