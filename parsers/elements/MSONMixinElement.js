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

  getBody(resolvedTypes) {
    const typeEl = resolvedTypes[this.className];
    return typeEl.getBody(resolvedTypes);
  }

  getSchema(resolvedTypes, flags = {}) {
    const typeEl = resolvedTypes[this.className];
    return typeEl.getSchema(resolvedTypes, flags);
  }
}

module.exports = MSONMixinElement;
