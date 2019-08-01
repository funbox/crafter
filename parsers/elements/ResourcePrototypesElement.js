const Refract = require('../../Refract');

class ResourcePrototypesElement {
  constructor() {
    this.resourcePrototypes = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.category,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.resourcePrototypes,
          }],
        },
      },
      content: this.resourcePrototypes.map(rp => rp.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = ResourcePrototypesElement;
