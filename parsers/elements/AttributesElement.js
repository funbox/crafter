const Refract = require('../../Refract');

class AttributesElement {
  constructor(content) {
    this.content = content;
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: this.content.toRefract(),
    };
  }
}

module.exports = AttributesElement;
