const Refract = require('../../Refract');

class DescriptionElement {
  constructor(description) {
    this.description = description;
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.copy,
      content: this.description,
    };
    if (this.sourceMap) {
      result.attributes = {
        sourceMap: this.sourceMap.toRefract(),
      };
    }
    return result;
  }
}

module.exports = DescriptionElement;
