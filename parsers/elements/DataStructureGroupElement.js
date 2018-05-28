const Refract = require('../../Refract');

class DataStructureGroupElement {
  constructor() {
    this.dataStructures = [];
  }

  toRefract() {
    return {
      element: Refract.elements.category,
      meta: {
        classes: [
          Refract.categoryClasses.dataStructures
        ]
      },
      content: this.dataStructures.map(ds => ds.toRefract()),
    }
  }
}

module.exports = DataStructureGroupElement;