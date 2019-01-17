const Refract = require('../../Refract');

class AttributesElement {
  constructor(content) {
    this.content = content;
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: this.content.toRefract(),
    };
  }

  getBody(resolvedTypes) {
    return this.content.getBody(resolvedTypes);
  }

  getSchema(resolvedTypes, flags = {}) {
    return this.content.getSchema(resolvedTypes, flags);
  }
}

module.exports = AttributesElement;
