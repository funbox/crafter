const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class MetaDataElement {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: Refract.elements.string,
          content: this.key,
        },
        value: {
          element: Refract.elements.string,
          content: this.value,
        },
      },
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: 'user',
          }],
        },
      },
    };

    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }
    return result;
  }
}

module.exports = MetaDataElement;
