const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

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
  /**
   * @param {SourceMap} sourceMap
   */
  constructor(sourceMap) {
    /**
     *
     * @type {SchemaNamedTypeElement[]}
     */
    this.schemaStructures = [];
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
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

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }
}

module.exports = SchemaStructureGroupElement;
