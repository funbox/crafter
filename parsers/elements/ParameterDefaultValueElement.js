const Refract = require('../../Refract');

class ParameterDefaultValueElement {
  constructor(value) {
    this.value = value;
  }

  toRefract() {
    return {
      element: Refract.elements.string,
      content: this.value,
    };
  }
}

module.exports = ParameterDefaultValueElement;
