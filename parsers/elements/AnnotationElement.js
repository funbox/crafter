const Refract = require('../../Refract');
const SourceMapElementWithLineColumnInfo = require('./SourceMapElementWithLineColumnInfo');

/**
 * Annotation of errors and warnings
 *
 * @see https://apielements.org/en/latest/element-definitions.html#annotation-string
 */

class AnnotationElement {
  /**
   * @param {'warning'|'error'} type
   * @param {string} text
   * @param sourceMap
   */
  constructor(type, text, sourceMap) {
    this.type = type;
    this.text = text;
    this.sourceMap = sourceMap;
  }

  toRefract() {
    const sourceMapEl = this.sourceMap ? new SourceMapElementWithLineColumnInfo(this.sourceMap.charBlocks) : null;
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
