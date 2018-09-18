const Refract = require('../../Refract');

class DefaultValueElement {
  constructor(value) {
    this.value = value;
    this.sourceMap = null;
  }

  toRefract() {
    return {
      element: Refract.elements.string,
      content: this.value,
      ...(this.sourceMap ? {
        attributes: { sourceMap: this.sourceMap.toRefract() },
      } : {}),
    };
  }
}

module.exports = DefaultValueElement;
