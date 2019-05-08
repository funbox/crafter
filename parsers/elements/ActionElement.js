const Refract = require('../../Refract');
const RequestElement = require('./RequestElement');
const SourceMapElement = require('./SourceMapElement');

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

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.transition,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(sourceMapEl && this.title ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
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
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      };
    }

    if (this.parameters) {
      result.attributes = result.attributes || {};
      result.attributes.hrefVariables = this.parameters.toRefract(sourceMapsEnabled);
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
            request.toRefract(sourceMapsEnabled),
            response.toRefract(sourceMapsEnabled),
          ],
        });
      });
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = ActionElement;
