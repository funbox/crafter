const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Секция Schema. Либо создается автоматически из AttributesElement, либо задается вручную.
 *
 * Пример:
 *
 * + Schema
 *     {"type": "string"}
 *
 * дерево:
 *
 * SchemaElement
 *   schema: {"type": "string"}
 *
 * @see https://apielements.org/en/latest/element-definitions.html#asset-string
 */
class SchemaElement {
  /**
   * @param {Object} schema
   */
  constructor(schema) {
    this.schema = schema;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

    const result = {
      element: Refract.elements.asset,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.messageBodySchema,
          }],
        },
      },
      attributes: {
        contentType: {
          element: Refract.elements.string,
          content: 'application/schema+json',
        },
      },
      content: JSON.stringify(this.schema, null, 2),
    };

    if (sourceMapEl) {
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = SchemaElement;
