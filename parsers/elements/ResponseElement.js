const Refract = require('../../Refract');

class ResponseElement {
  constructor(statusCode = 200, contentType) {
    this.statusCode = statusCode;
    this.contentType = contentType;
    this.headersSections = [];
    this.content = [];
  }

  toRefract() {
    const result = {
      element: Refract.elements.httpResponse,
      content: this.content.map(c => c.toRefract()),
      attributes: {
        statusCode: {
          element: Refract.elements.string,
          content: this.statusCode,
        },
      },
    };

    if (this.contentType) {
      result.headers = {
        element: Refract.elements.httpHeaders,
        content: [{
          element: Refract.elements.member,
          content: {
            key: {
              element: Refract.elements.string,
              content: 'Content-Type',
            },
            value: {
              element: Refract.elements.string,
              content: this.contentType,
            },
          },
        }],
      };
    }

    this.headersSections.forEach((headers) => {
      if (result.headers) {
        result.headers.content = result.headers.content.concat(headers.toRefract().content);
      } else {
        result.headers = headers.toRefract();
      }
    });

    return result;
  }
}

module.exports = ResponseElement;
