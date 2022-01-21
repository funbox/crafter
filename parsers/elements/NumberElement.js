const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Element to store numeric structures inside of Element AST, as a HTTP Status Code
 */
class NumberElement {
  /**
   * @param {number} number
   * @param {SourceMap=} sourceMap
   */
  constructor(number, sourceMap) {
    this.number = number;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;
    const result = {
      element: Refract.elements.number,
      content: this.number,
    };
    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }
    return result;
  }

  equals(element = {}) {
    return element instanceof NumberElement && this.number === element.number;
  }
}

module.exports = NumberElement;
