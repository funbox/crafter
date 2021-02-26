const Refract = require('../../Refract');

class SourceMapElementWithLineColumnInfo {
  /**
   * @param {CharBlockWithLineColumnInfo[]} blocks
   */
  constructor(blocks) {
    this.blocks = blocks;
  }

  toRefract() {
    let file;
    const result = {
      element: Refract.elements.array,
      content: [],
    };

    this.blocks.forEach(block => {
      let sourceMapEl = result.content[result.content.length - 1];

      if (!sourceMapEl || file !== block.file) {
        sourceMapEl = {
          element: Refract.elements.sourceMap,
          content: [],
        };
        file = block.file;

        if (file) {
          sourceMapEl.file = file.replace(/\\/g, '/');
        }
        result.content.push(sourceMapEl);
      }

      sourceMapEl.content.push({
        element: Refract.elements.array,
        content: [
          {
            element: Refract.elements.number,
            attributes: {
              line: {
                element: Refract.elements.number,
                content: block.startLine,
              },
              column: {
                element: Refract.elements.number,
                content: block.startColumn,
              },
            },
            content: block.offset,
          },
          {
            element: Refract.elements.number,
            attributes: {
              line: {
                element: Refract.elements.number,
                content: block.endLine,
              },
              column: {
                element: Refract.elements.number,
                content: block.endColumn,
              },
            },
            content: block.length,
          },
        ],
      });
    });

    return result;
  }
}

module.exports = SourceMapElementWithLineColumnInfo;
