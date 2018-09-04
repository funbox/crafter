const Refract = require('../../Refract');

class ResponseElement {
  constructor(statusCode = 200, contentType) {
    this.statusCode = statusCode;
    this.contentType = contentType;
    this.description = null;
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
      result.attributes.headers = {
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
      if (result.attributes.headers) {
        result.attributes.headers.content = result.attributes.headers.content.concat(headers.toRefract().content);
      } else {
        result.attributes.headers = headers.toRefract();
      }
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract());
    }

    return result;
  }
}

module.exports = ResponseElement;
