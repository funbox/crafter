const Refract = require('../../Refract');

class DefaultValueElement {
  constructor(value, type) {
    this.value = Array.isArray(value) ? value[0] : value;
    this.type = type;
    this.sourceMap = null;
  }

  toRefract() {
    return {
      element: this.type || Refract.elements.string,
      content: this.value,
      ...(this.sourceMap ? {
        attributes: { sourceMap: this.sourceMap.toRefract() },
      } : {}),
    };
  }
}

module.exports = DefaultValueElement;
