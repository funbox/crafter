const Refract = require('../../Refract');

class MSONNamedTypeElement {
  constructor(name, baseType) {
    this.name = name;
    this.baseType = baseType; // TODO: Может быть задан неявно
    this.attributes = [];
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      meta: {
        id: {
          element: Refract.elements.string,
          content: this.name
        }
      },
      content: [this.attributes.map(a => a.toRefract())],
    }
  }
}

module.exports = MSONNamedTypeElement;