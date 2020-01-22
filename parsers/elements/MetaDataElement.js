const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Произвольные мета-данные документации в формате «ключ: значение»
 */
class MetaDataElement {
  /**
   * @param {string} key
   * @param {string} value
   */
  constructor(key, value) {
    this.key = key;
    this.value = value;
    /**
     * @type {SourceMapElement}
     */
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
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
