const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class StringElement {
  constructor(string, sourceMap) {
    this.string = string;
    this.sourceMap = sourceMap;
  }

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
}

module.exports = StringElement;
