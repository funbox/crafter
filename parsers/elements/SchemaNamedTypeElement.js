const Refract = require('../../Refract');

const SourceMapElement = require('./SourceMapElement');

/**
 * Именованный тип, описанный с помощью JSON Schema.
 *
 * Пример:
 *
 * # Schema Structures
 * # SchemaNamedType <--
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
class SchemaNamedTypeElement {
  /**
   * @param {StringElement} name
   * @param {SourceMap} sourceMap
   */
  constructor(name, sourceMap) {
    this.name = name;
    /**
     * @type {BodyElement}
     */
    this.bodyEl = null;
    /**
     * @type {SchemaElement}
     */
    this.schemaEl = null;
    /**
     * bodyEl, преобразованный в объект с помощью JSON.parse
     */
    this.body = null;

    /**
     * @type {DescriptionElement}
     */
    this.description = null;

    this.sourceMap = sourceMap;
  }

  isComplex() {
    return true;
  }

  getBody() {
    return this.body;
  }

  getSchema() {
    const usedTypes = [];
    return [this.schemaEl.schema, usedTypes];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.schemaStructure,
      meta: {
        id: this.name.toRefract(sourceMapsEnabled),
      },
      content: [this.bodyEl.toRefract(sourceMapsEnabled), this.schemaEl.toRefract(sourceMapsEnabled)],
    };

    if (this.description) {
      const description = {
        element: Refract.elements.string,
        content: this.description.description,
      };
      if (sourceMapsEnabled && this.description.sourceMap) {
        description.attributes = {
          sourceMap: new SourceMapElement(this.description.sourceMap.byteBlocks).toRefract(),
        };
      }
      result.meta.description = description;
    }

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }
}

module.exports = SchemaNamedTypeElement;
