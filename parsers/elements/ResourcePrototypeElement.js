const Refract = require('../../Refract');

class ResourcePrototypeElement {
  constructor() {
  }

  toRefract() {
    return {
      element: Refract.elements.resourcePrototype,
      content: [],
    }
  }
}

module.exports = ResourcePrototypeElement;