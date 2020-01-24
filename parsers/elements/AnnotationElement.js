const Refract = require('../../Refract');
const SourceMapElementWithLineColumnInfo = require('./SourceMapElementWithLineColumnInfo');

/**
 * Описание для ошибок и предупреждений
 */

class AnnotationElement {
  /**
   * @param {string} type - warning или error
   * @param {string} text
   * @param sourceMap
   */
  constructor(type, text, sourceMap) {
    this.type = type;
    this.text = text;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
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
