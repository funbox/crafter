const Refract = require('../../Refract');

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
          attributes: { sourceMap: sourceMap.toRefract(sourceMapsEnabled) },
        } : {}),
      })),
    };
  }
}

module.exports = HeadersElement;
