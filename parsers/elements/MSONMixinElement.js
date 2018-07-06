const Refract = require('../../Refract');

class MSONMixinElement {
  constructor(className) {
    this.className = className;
  }

  toRefract() {
    return {
      element: Refract.elements.ref,
      attributes: {
        path: {
          element: Refract.elements.string,
          content: 'content',
        },
      },
      content: this.className,
    };
  }
}

module.exports = MSONMixinElement;
