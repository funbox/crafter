const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 *  Описание документации, может содержать Markdown разметку
 *
 * Пример:
 * # My API
 *
 * Описание API <-- эта строка будет извлечена в DescriptionElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#copy-string
 */
class DescriptionElement {
  /**
   * @param {string} description
   */
  constructor(description) {
    this.description = description;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;
    const result = {
      element: Refract.elements.copy,
      content: this.description,
    };
    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }
    return result;
  }
}

module.exports = DescriptionElement;
