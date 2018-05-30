const Refract = require('../../Refract');

class AttributesElement {
  constructor(baseType) {
    this.baseType = baseType;
    this.attributes = [];
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: {
        element: Refract.elements.object,
        content: this.attributes.map(i => i.toRefract())
      }
    };
  }
}

module.exports = AttributesElement;