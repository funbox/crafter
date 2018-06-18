const Refract = require('../../Refract');

const ValueMemberElement = require('./ValueMemberElement');

class AttributesElement {
  constructor(baseType, typeAttributes) {
    this.content = new ValueMemberElement(baseType, typeAttributes);
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: this.content.toRefract(),
    };
  }
}

module.exports = AttributesElement;
