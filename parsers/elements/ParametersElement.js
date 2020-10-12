const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

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
 *
 * @see https://apielements.org/en/latest/element-definitions.html#href-variables-object
 */
class ParametersElement {
  /**
   * @param {SourceMap} sourceMap
   */
  constructor(sourceMap) {
    /**
     * @type {ParameterElement[]}
     */
    this.parameters = [];
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.hrefVariables,
      content: this.parameters.map(p => p.toRefract(sourceMapsEnabled)),
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

module.exports = ParametersElement;
