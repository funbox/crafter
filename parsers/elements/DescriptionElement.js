const Refract = require('../../Refract');

class DescriptionElement {
  constructor(description) {
    this.description = description;
  }

  toRefract() {
    return {
      element: Refract.elements.copy,
      content: this.description,
    };
  }
}

module.exports = DescriptionElement;
