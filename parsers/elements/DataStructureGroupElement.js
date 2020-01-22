const Refract = require('../../Refract');

/**
 * Секция Data Structures
 *
 * # Data Structures <-- Секция Data Structures
 * ## User
 * + name (string, required)
 * + email (string, required)
 */
class DataStructureGroupElement {
  constructor() {
    /**
     * @type {MSONNamedTypeElement[]}
     */
    this.dataStructures = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
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
