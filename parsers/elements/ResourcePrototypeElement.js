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
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.resourcePrototype,
      meta: {
        id: this.title.toRefract(sourceMapsEnabled),
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

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    return result;
  }
}

module.exports = ResourcePrototypeElement;
