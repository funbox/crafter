const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент Resource Prototypes.
 *
 * Пример:
 *
 * # Resource Prototypes <--
 * ## UserResource
 *   + Response 200 (application/json)
 *   + Attributes (UnauthorizedError, required)
 */
class ResourcePrototypesElement {
  /**
   * @param {SourceMap} sourceMap
   */
  constructor(sourceMap) {
    /**
     * @type {ResourcePrototypeElement[]}
     */
    this.resourcePrototypes = [];
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
            content: Refract.categoryClasses.resourcePrototypes,
          }],
        },
      },
      content: this.resourcePrototypes.map(rp => rp.toRefract(sourceMapsEnabled)),
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

module.exports = ResourcePrototypesElement;
