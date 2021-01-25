const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const { addPrototypesToRefract } = require('./ResourcePrototypesUtils');

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
   * @param {StringElement[]} prototypes - список прототипов, от которых наследуется текущий
   */
  constructor(title, prototypes = []) {
    this.title = title;
    /**
     * @type {ResponseElement[]}
     */
    this.responses = [];
    this.prototypes = prototypes;
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

    addPrototypesToRefract(this, result, sourceMapsEnabled);

    return result;
  }
}

module.exports = ResourcePrototypeElement;
