const Refract = require('../../Refract');

const SourceMapElement = require('./SourceMapElement');

/**
 * Именованный тип данных
 *
 * # Data Structures
 * ## User <-- именованный тип данных
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
     * В самом именованном типе хранится только название и описание.
     * Все внутренности типа лежат в этом поле.
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
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }
}

module.exports = MSONNamedTypeElement;
