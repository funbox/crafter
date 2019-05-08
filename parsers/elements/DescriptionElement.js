const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class DescriptionElement {
  constructor(description) {
    this.description = description;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;
    const result = {
      element: Refract.elements.copy,
      content: this.description,
    };
    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }
    return result;
  }
}

module.exports = DescriptionElement;
