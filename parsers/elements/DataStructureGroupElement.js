const Refract = require('../../Refract');

class DataStructureGroupElement {
  constructor() {
    this.dataStructures = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.category,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.dataStructures,
          }],
        },
      },
      content: this.dataStructures.map(ds => ds.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = DataStructureGroupElement;
