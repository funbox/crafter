const Refract = require('../../Refract');

class SourceMapElement {
  constructor(byteBlocks) {
    this.byteBlocks = byteBlocks;
  }

  toRefract() {
    return {
      element: Refract.elements.sourceMap,
      content: this.byteBlocks.map(block => [block.offset, block.length]),
    };
  }
}

module.exports = SourceMapElement;
