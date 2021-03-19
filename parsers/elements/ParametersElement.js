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
      element: Refract.elements.hrefVariables,
      content: this.parameters.map(p => p.toRefract(sourceMapsEnabled)),
    };

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

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

module.exports = ParametersElement;
