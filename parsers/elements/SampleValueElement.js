const Refract = require('../../Refract');

class SampleValueElement {
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

module.exports = SampleValueElement;
