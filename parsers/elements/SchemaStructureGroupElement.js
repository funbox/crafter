const Refract = require('../../Refract');

/**
 * Элемент Schema Structures.
 *
 * Пример:
 *
 * # Schema Structures <--
 * # SchemaNamedType
 *   + Body
 *     79000000123
 *   + Schema
 *     {
 *       "type": "number",
 *       "minimum": 79000000000,
 *       "maximum": 79999999999,
 *       "multipleOf": 1.0
 *     }
 */
class SchemaStructureGroupElement {
  constructor() {
    /**
     *
     * @type {SchemaNamedTypeElement[]}
     */
    this.schemaStructures = [];
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
            content: Refract.categoryClasses.schemaStructures,
          }],
        },
      },
      content: this.schemaStructures.map(ss => ss.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = SchemaStructureGroupElement;
