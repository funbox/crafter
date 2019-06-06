const Refract = require('../../Refract');

class SchemaStructureGroupElement {
  constructor() {
    this.schemaStructures = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.category,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.schemaStructures,
          }],
        },
      },
      content: this.schemaStructures.map(ss => ss.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = SchemaStructureGroupElement;
