const Refract = require('../../Refract');

class BodyElement {
  constructor(body) {
    this.body = body;
    this.contentType = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.asset,
      meta: {
        classes: [
          Refract.categoryClasses.messageBody
        ]
      },
      content: this.body,
    };

    if (this.contentType) {
      result.attributes = {
        contentType: {
          element: Refract.elements.string,
          content: this.contentType,
        }
      };
    }

    return result;
  }
}

module.exports = BodyElement;