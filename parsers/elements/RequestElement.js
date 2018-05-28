const Refract = require('../../Refract');

class RequestElement {
  constructor(contentType, title) {
    this.contentType = contentType;
    this.title = title;
    this.method = null;
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
        }
      },
      content: this.content.map(c => c.toRefract()),
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
            }
          }
        }]
      };
    }

    if (this.title) {
      result.meta = {
        title: {
          element: Refract.elements.string,
          content: this.title,
        }
      };
    }

    this.headersSections.forEach(headers => {
      if (result.headers) {
        result.headers.content = result.headers.content.concat(headers.toRefract().content);
      } else {
        result.headers = headers.toRefract();
      }
    });

    return result;
  }
}

module.exports = RequestElement;