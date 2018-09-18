const Refract = require('../../Refract');
const RequestElement = require('./RequestElement');

class ActionElement {
  constructor(title, href, method) {
    this.title = title;
    this.href = href;
    this.method = method;
    this.requests = [];
    this.responses = [];
    this.parameters = null;
    this.description = null;
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.transition,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(this.sourceMap && this.title ? {
            attributes: { sourceMap: this.sourceMap.toRefract() },
          } : {}),
        },
      },
      content: [],
    };

    if (this.href) {
      result.attributes = {
        href: {
          element: Refract.elements.string,
          content: this.href,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract() },
          } : {}),
        },
      };
    }

    if (this.parameters) {
      result.attributes.hrefVariables = this.parameters.toRefract();
    }

    let requests = this.requests;
    const responses = this.responses;

    if (requests.length === 0) {
      const request = new RequestElement();
      request.method = this.method;
      requests = requests.concat([request]);
    }

    requests.forEach((request) => {
      responses.forEach((response) => {
        result.content.push({
          element: Refract.elements.httpTransaction,
          content: [
            request.toRefract(),
            response.toRefract(),
          ],
        });
      });
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract());
    }

    return result;
  }
}

module.exports = ActionElement;
