const Refract = require('../../Refract');

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
  constructor() {
    /**
     * @type {ResourcePrototypeElement[]}
     */
    this.resourcePrototypes = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
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
  }
}

module.exports = ResourcePrototypesElement;
