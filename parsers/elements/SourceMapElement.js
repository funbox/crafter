const Refract = require('../../Refract');

class SourceMapElement {
  constructor(byteBlocks, file) {
    this.byteBlocks = byteBlocks;
    this.file = file;
  }

  toRefract() {
    const result = {
      element: Refract.elements.sourceMap,
      content: this.byteBlocks.map(block => [block.offset, block.length]),
    };
    if (this.file) {
      result.file = this.file;
    }
    return result;
  }
}

module.exports = SourceMapElement;
