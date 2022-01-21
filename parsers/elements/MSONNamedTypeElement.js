const Refract = require('../../Refract');

const SourceMapElement = require('./SourceMapElement');

/**
 * Named data type
 *
 * # Data Structures
 * ## User <-- named data type
 * + name (string, required)
 * + email (string, required)
 *
 * @see https://apielements.org/en/latest/element-definitions.html#data-structure
 */
class MSONNamedTypeElement {
  /**
   *
   * @param {StringElement} name
   * @param {ValueMemberElement} valueElement
   * @param {SourceMap} sourceMap
   */
  constructor(name, valueElement, sourceMap) {
    this.name = name;
    /**
     * A named type element stores only a title and a description.
     * All internals of the type lie in this field.
     * @type {ValueMemberElement}
     */
    this.content = valueElement;
    /**
     * @type {DescriptionElement}
     */
    this.description = null;

    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.dataStructure,
      content: Object.assign(this.content.toRefract(sourceMapsEnabled), {
        meta: {
          id: this.name.toRefract(sourceMapsEnabled),
        },
      }),
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
      result.content.meta.description = description;
    }

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }
}

module.exports = MSONNamedTypeElement;
