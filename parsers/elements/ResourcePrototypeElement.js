const Refract = require('../../Refract');

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

    if (this.basePrototypes.length > 0) {
      result.meta.basePrototypes = {
        element: Refract.elements.array,
        content: this.basePrototypes.map(bp => bp.toRefract(sourceMapsEnabled)),
      };
    }

    return result;
  }
}

module.exports = ResourcePrototypeElement;
