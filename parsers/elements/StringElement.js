const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент для описания строковых структур внутри Element AST, таких, как названия именнованных типов, полей объекта и т.п.
 */
class StringElement {
  /**
   * @param {string} string
   * @param {SourceMapElement=} sourceMap
   */
  constructor(string, sourceMap) {
    this.string = string;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;
    const result = {
      element: Refract.elements.string,
      content: this.string,
    };
    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }
    return result;
  }

  getBody() {
    return this.string;
  }

  equals(element = {}) {
    return element instanceof StringElement && this.string === element.string;
  }
}

module.exports = StringElement;
