const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Секция Body. Либо создается автоматически из AttributesElement, либо задается вручную.
 *
 * Пример:
 *
 * + Body
 *
 *     Hello world
 *
 * дерево:
 *
 * BodyElement
 *   body: Hello world
 */
class BodyElement {
  /**
   * @param {string} body
   */
  constructor(body) {
    this.body = body;
    /**
     * @type {string}
     */
    this.contentType = undefined;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;
    const body = (typeof this.body === 'object') ? JSON.stringify(this.body, null, 2) : this.body;

    const result = {
      element: Refract.elements.asset,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.messageBody,
          }],
        },
      },
      content: body,
    };

    if (this.contentType) {
      result.attributes = result.attributes || {};
      result.attributes.contentType = {
        element: Refract.elements.string,
        content: this.contentType,
      };
    }

    if (sourceMapEl) {
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = BodyElement;
