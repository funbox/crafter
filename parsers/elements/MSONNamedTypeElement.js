const Refract = require('../../Refract');

class MSONNamedTypeElement {
  constructor() {
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: [],
    }
  }
}

module.exports = MSONNamedTypeElement;