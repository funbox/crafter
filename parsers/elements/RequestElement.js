const Refract = require('../../Refract');

class RequestElement {
  constructor(contentType, title) {
    this.contentType = contentType;
    this.title = title;
    this.method = null;
    this.description = null;
    this.headersSections = [];
    this.content = [];
  }

  toRefract() {
    const result = {
      element: Refract.elements.httpRequest,
      attributes: {
        method: {
          element: Refract.elements.string,
          content: this.method,
        },
      },
      content: this.content.map(c => c.toRefract()),
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

    if (this.title) {
      result.meta = {
        title: {
          element: Refract.elements.string,
          content: this.title,
        },
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

module.exports = RequestElement;
