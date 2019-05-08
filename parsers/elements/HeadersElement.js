const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class HeadersElement {
  constructor(headers) {
    this.headers = headers;
  }

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
