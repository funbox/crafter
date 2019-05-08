const Refract = require('../../Refract');

class BodyElement {
  constructor(body) {
    this.body = body;
    this.contentType = null;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const body = (typeof this.body === 'object') ? JSON.stringify(this.body, null, 2) : this.body;

    const result = {
      element: Refract.elements.asset,
      meta: {
        classes: [
          Refract.categoryClasses.messageBody,
        ],
      },
      content: body,
    };

    if (this.contentType) {
      result.attributes = result.attributes || {};
      result.attributes.contentType = {
        element: Refract.elements.string,
        content: this.contentType,
      };
    }

    if (sourceMapsEnabled && this.sourceMap) {
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = this.sourceMap.toRefract(sourceMapsEnabled);
    }

    return result;
  }

  getSchema() {
    return {};
  }
}

module.exports = BodyElement;
