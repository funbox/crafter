const Refract = require('../../Refract');

/**
 * Параметры URL
 *
 * Пример:
 *
 * + Parameters
 *   + a (string, required)
 *
 * Дерево:
 *
 * ParametersElement <--
 *   parameters:
 *     - ParameterElement
 */
class ParametersElement {
  constructor() {
    /**
     * @type {ParameterElement[]}
     */
    this.parameters = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.hrefVariables,
      content: this.parameters.map(p => p.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = ParametersElement;
