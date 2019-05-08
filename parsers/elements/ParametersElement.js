const Refract = require('../../Refract');

class ParametersElement {
  constructor() {
    this.parameters = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.hrefVariables,
      content: this.parameters.map(p => p.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = ParametersElement;
