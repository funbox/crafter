const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 *  Documentation description, can include Markdown markup.
 *
 * Example:
 * # My API
 *
 * API description <-- this line will be extracted as a DescriptionElement
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
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;
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
