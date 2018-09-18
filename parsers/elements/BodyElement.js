const Refract = require('../../Refract');

class BodyElement {
  constructor(body) {
    this.body = body;
    this.contentType = null;
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.asset,
      meta: {
        classes: [
          Refract.categoryClasses.messageBody,
        ],
      },
      content: this.body,
    };

    if (this.contentType) {
      result.attributes = result.attributes || {};
      result.attributes.contentType = {
        element: Refract.elements.string,
        content: this.contentType,
      };
    }

    if (this.sourceMap) {
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = this.sourceMap.toRefract();
    }

    return result;
  }
}

module.exports = BodyElement;
