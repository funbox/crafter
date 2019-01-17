const Refract = require('../../Refract');

class StringElement {
  constructor(string, sourceMap) {
    this.string = string;
    this.sourceMap = sourceMap;
  }

  toRefract() {
    const result = {
      element: Refract.elements.string,
      content: this.string,
    };
    if (this.sourceMap) {
      result.attributes = {
        sourceMap: this.sourceMap.toRefract(),
      };
    }
    return result;
  }

  getBody() {
    return this.string;
  }
}

module.exports = StringElement;
