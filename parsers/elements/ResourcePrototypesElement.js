const Refract = require('../../Refract');

class ResourcePrototypesElement {
  constructor() {
    this.resourcePrototypes = [];
  }

  toRefract() {
    return {
      element: Refract.elements.category,
      meta: {
        classes: [
          Refract.categoryClasses.resourcePrototypes,
        ],
      },
      content: this.resourcePrototypes.map(rp => rp.toRefract()),
    };
  }
}

module.exports = ResourcePrototypesElement;
