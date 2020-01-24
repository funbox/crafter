const Refract = require('../../Refract');

class SourceMapElementWithLineColumnInfo {
  constructor(blocks, file) {
    this.blocks = blocks;
    this.file = file;
  }

  toRefract() {
    const sourceMapEl = {
      element: Refract.elements.sourceMap,
      content: this.blocks.map(block => ({
        element: 'array',
        content: [
          {
            element: 'number',
            attributes: {
              line: {
                element: 'number',
                content: block.startLine,
              },
              column: {
                element: 'number',
                content: block.startColumn,
              },
            },
            content: block.offset,
          },
          {
            element: 'number',
            attributes: {
              line: {
                element: 'number',
                content: block.endLine,
              },
              column: {
                element: 'number',
                content: block.endColumn,
              },
            },
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

module.exports = SourceMapElementWithLineColumnInfo;
