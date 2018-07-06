const Refract = require('../../Refract');

class HeadersElement {
  constructor(headers) {
    this.headers = headers;
  }

  toRefract() {
    return {
      element: Refract.elements.httpHeaders,
      content: this.headers.map(({ key, val }) => ({
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
      })),
    };
  }
}

module.exports = HeadersElement;
