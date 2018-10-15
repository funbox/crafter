const Refract = require('../../Refract');

class SourceMapElement {
  constructor(byteBlocks, file) {
    this.byteBlocks = byteBlocks;
    this.file = file;
  }

  toRefract() {
    const sourceMapEl = {
      element: Refract.elements.sourceMap,
      content: this.byteBlocks.map(block => ({
        element: 'array',
        content: [
          {
            element: 'number',
            content: block.offset,
          },
          {
            element: 'number',
            content: block.length,
          },
        ],
      })),
    };
    if (this.file) {
      const platformIndependentPath = this.file.replace(/\\/g, '/');
      sourceMapEl.file = platformIndependentPath;
    }
    return {
      element: 'array',
      content: [sourceMapEl],
    };
  }
}

module.exports = SourceMapElement;
