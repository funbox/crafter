const Refract = require('../../Refract');

class DescriptionElement {
  constructor(description) {
    this.description = description;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.copy,
      content: this.description,
    };
    if (sourceMapsEnabled && this.sourceMap) {
      result.attributes = {
        sourceMap: this.sourceMap.toRefract(sourceMapsEnabled),
      };
    }
    return result;
  }
}

module.exports = DescriptionElement;
