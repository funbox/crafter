const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент для хранения HTTP заголовков запросов и ответов
 * Структура отдельного заголовка достаточно простая, поэтому отдельный тип данных под нее не предусмотрен
 */
class HeadersElement {
  /**
   * @param {Object[]} headers
   * @param {string} headers.key
   * @param {string} headers.val
   * @param {Object} headers.sourceMap
   */
  constructor(headers) {
    this.headers = headers;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
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
          attributes: { sourceMap: new SourceMapElement(sourceMap.byteBlocks, sourceMap.file).toRefract() },
        } : {}),
      })),
    };
  }
}

module.exports = HeadersElement;
