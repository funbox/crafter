const Refract = require('../../Refract');
const SourceMapElementWithLineColumnInfo = require('./SourceMapElementWithLineColumnInfo');

class AnnotationElement {
  constructor(type, text, sourceMap) {
    this.type = type;
    this.text = text;
    this.sourceMap = sourceMap;
  }

  toRefract() {
    const sourceMapEl = this.sourceMap ? new SourceMapElementWithLineColumnInfo(this.sourceMap.charBlocks, this.sourceMap.file) : null;
    return {
      element: Refract.elements.annotation,
      meta: {
        classes: {
          element: 'array',
          content: [
            {
              element: 'string',
              content: this.type,
            },
          ],
        },
      },
      ...(sourceMapEl ? {
        attributes: { sourceMap: sourceMapEl.toRefract() },
      } : {}),
      content: this.text,
    };
  }
}

module.exports = AnnotationElement;
