const Refract = require('../../Refract');

class ResourcePrototypesElement {
  constructor() {
  }

  toRefract() {
    return {
      element: Refract.elements.resourcePrototype,
      content: [],
    }
  }
}

module.exports = ResourcePrototypesElement;