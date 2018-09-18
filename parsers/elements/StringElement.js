const Refract = require('../../Refract');

class StringElement {
  constructor(string) {
    this.string = string;
    this.sourceMap = null;
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
}

module.exports = StringElement;
