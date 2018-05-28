const Refract = require('../../Refract');

class ParametersElement {
  constructor() {
    this.parameters = [];
  }

  toRefract() {
    return {
      element: Refract.elements.hrefVariables,
      content: this.parameters.map(p => p.toRefract()),
    };
  }
}

module.exports = ParametersElement;