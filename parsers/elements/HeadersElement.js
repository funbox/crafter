const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Element to store HTTP headers of requests and responses.
 * The structure of a header is quite simple, so there is no separate data type for it.
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

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = HeadersElement;
