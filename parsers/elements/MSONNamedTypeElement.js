const Refract = require('../../Refract');

const MSONObjectElement = require('./MSONObjectElement');

class MSONNamedTypeElement {
  constructor(name, baseType) {
    this.object = new MSONObjectElement(name, baseType);
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: this.object.toRefract(),
    }
  }
}

module.exports = MSONNamedTypeElement;