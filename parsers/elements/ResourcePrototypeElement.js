const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент Resource Prototype.
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
   * @param {StringElement} title - название прототипа
   * @param {StringElement[]} basePrototypes - список прототипов, от которых наследуется текущий
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
    const result = {
      element: Refract.elements.resourcePrototype,
      meta: {
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: this.responses.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    if (this.basePrototypes.length) {
      result.attributes = result.attributes || {};
      result.attributes.prototypes = {
        element: Refract.elements.array,
        content: this.basePrototypes.map(p => p.toRefract(sourceMapsEnabled)),
      };
    }

    return result;
  }
}

module.exports = ResourcePrototypeElement;
