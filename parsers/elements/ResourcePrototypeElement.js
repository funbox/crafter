const Refract = require('../../Refract');

class ResourcePrototypeElement {
  constructor(title) {
    this.title = title;
    this.responses = [];
  }

  toRefract() {
    return {
      element: Refract.elements.resourcePrototype,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
        },
      },
      content: this.responses.map(r => r.toRefract()),
    }
  }
}

module.exports = ResourcePrototypeElement;