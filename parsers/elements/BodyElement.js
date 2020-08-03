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
 *
 * @see https://apielements.org/en/latest/element-definitions.html#asset-string
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
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

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
      content: this.body,
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
