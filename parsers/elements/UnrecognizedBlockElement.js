const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Element to keep unrecognized nodes found during documentation parsing
 */
class UnrecognizedBlockElement {
  /**
   * @param {SourceMap} sourceMap
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
