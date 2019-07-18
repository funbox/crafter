const { elements: { array } } = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class SampleValueElement {
  constructor(value, type, sourceMap) {
    this.value = value;
    this.type = type; // тут должен прийти либо примитивный тип, либо массив
    this.sourceMap = sourceMap;
  }

  toRefract(sourceMapsEnabled) {
    if (Array.isArray(this.value)) {
      return this.toRefractForArray(sourceMapsEnabled);
    }

    return this.toRefractForPrimitive(sourceMapsEnabled);
  }

  toRefractForArray(sourceMapsEnabled) {
    return {
      element: array,
      content: this.value.map((v, i) => {
        const result = {
          element: this.type,
          content: v,
        };

        if (sourceMapsEnabled && this.sourceMap[i]) {
          const sourceMapEl = new SourceMapElement(this.sourceMap[i].byteBlocks, this.sourceMap[i].file);
          result.attributes = {
            sourceMap: sourceMapEl.toRefract(),
          };
        }

        return result;
      }),
    };
  }

  toRefractForPrimitive(sourceMapsEnabled) {
    const result = {
      element: this.type,
      content: this.value,
    };


    if (sourceMapsEnabled && this.sourceMap) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }

  getBody() {
    return this.value;
  }
}

module.exports = SampleValueElement;
