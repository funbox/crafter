const Refract = require('../../Refract');

const MSONObjectElement = require('./MSONObjectElement');

class AttributesElement {
  constructor(baseType) {
    this.object = new MSONObjectElement(null, baseType);
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: this.object.toRefract(),
    };
  }
}

module.exports = AttributesElement;