const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Секция Data Structures
 *
 * # Data Structures <-- Секция Data Structures
 * ## User
 * + name (string, required)
 * + email (string, required)
 *
 * @see https://apielements.org/en/latest/element-definitions.html#category
 */
class DataStructureGroupElement {
  /**
   * @param {SourceMap} sourceMap
   */
  constructor(sourceMap) {
    /**
     * @type {MSONNamedTypeElement[]}
     */
    this.dataStructures = [];
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
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
            content: Refract.categoryClasses.dataStructures,
          }],
        },
      },
      content: this.dataStructures.map(ds => ds.toRefract(sourceMapsEnabled)),
    };

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = DataStructureGroupElement;
