const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Element to store string structures inside of Element AST, such as names of named types, fields of objects, and so on
 */
class StringElement {
  /**
   * @param {string} string
   * @param {SourceMap=} sourceMap
   */
  constructor(string, sourceMap) {
    this.string = string;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;
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
