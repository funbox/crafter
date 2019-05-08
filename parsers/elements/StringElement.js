const Refract = require('../../Refract');

class StringElement {
  constructor(string, sourceMap) {
    this.string = string;
    this.sourceMap = sourceMap;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.string,
      content: this.string,
    };
    if (sourceMapsEnabled && this.sourceMap) {
      result.attributes = {
        sourceMap: this.sourceMap.toRefract(sourceMapsEnabled),
      };
    }
    return result;
  }

  getBody() {
    return this.string;
  }
}

module.exports = StringElement;
