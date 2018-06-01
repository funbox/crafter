const Refract = require('../../Refract');

class AttributesElement {
  constructor(baseType) {
    this.baseType = baseType;
    this.content = [];
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: {
        element: Refract.elements.object,
        content: this.content.map(i => i.toRefract())
      }
    };
  }
}

module.exports = AttributesElement;