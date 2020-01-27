const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент Resource Prototype
 *
 * Пример:
 *
 * # Resource Prototypes
 * ## UserResource <--
 *   + Response 200 (application/json)
 *   + Attributes (UnauthorizedError, required)
 */
class ResourcePrototypeElement {
  /**
   *
   * @param {string} title
   * @param {string[]} basePrototypes
   */
  constructor(title, basePrototypes = []) {
    this.title = title;
    /**
     * @type {ResponseElement[]}
     */
    this.responses = [];
    this.basePrototypes = basePrototypes;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.resourcePrototype,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      },
      content: this.responses.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (this.basePrototypes.length > 0) {
      result.meta.basePrototypes = {
        element: Refract.elements.array,
        content: this.basePrototypes.map(bp => ({
          element: Refract.elements.string,
          content: bp,
        })),
      };
    }

    return result;
  }
}

module.exports = ResourcePrototypeElement;
