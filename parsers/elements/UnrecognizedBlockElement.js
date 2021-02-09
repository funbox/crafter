const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент для описания неожиданных нод, обнаруженных при парсинге документации
 */
class UnrecognizedBlockElement {
  /**
   * @param {SourceMap=} sourceMap
   */
  constructor(sourceMap) {
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled ? new SourceMapElement(this.sourceMap.byteBlocks) : null;
    const result = {
      element: Refract.elements.unrecognizedBlock,
    };
    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }
    return result;
  }
}

module.exports = UnrecognizedBlockElement;
