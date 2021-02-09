const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент для хранения HTTP-заголовков запросов и ответов.
 * Структура отдельного заголовка достаточно простая, поэтому отдельный тип данных под нее не предусмотрен.
 *
 * @see https://apielements.org/en/latest/element-definitions.html#http-headers-object
 */
class HeadersElement {
  /**
   * @param {Object[]} headers
   * @param {string} headers.key
   * @param {string} headers.val
   * @param {Object} headers.sourceMap
   * @param {SourceMap} sourceMap
   */
  constructor(headers, sourceMap) {
    this.headers = headers;
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.httpHeaders,
      content: this.headers.map(({ key, val, sourceMap }) => ({
        element: Refract.elements.member,
        content: {
          key: {
            element: Refract.elements.string,
            content: key,
          },
          value: {
            element: Refract.elements.string,
            content: val,
          },
        },
        ...(sourceMapsEnabled && sourceMap ? {
          attributes: { sourceMap: new SourceMapElement(sourceMap.byteBlocks).toRefract() },
        } : {}),
      })),
    };

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = HeadersElement;
