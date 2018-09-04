const Refract = require('../../Refract');

class ResourceElement {
  constructor(title, href) {
    this.title = title;
    this.href = href;
    this.description = null;
    this.parameters = null;
    this.actions = [];
  }

  toRefract() {
    const result = {
      element: Refract.elements.resource,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
        },
      },
      attributes: {
        href: {
          element: Refract.elements.string,
          content: this.href,
        },
      },
      content: this.actions.map(a => a.toRefract()),
    };

    if (this.parameters) {
      result.attributes.hrefVariables = this.parameters.toRefract();
    }

    if (this.description) {
      result.content.unshift(this.description.toRefract());
    }

    return result;
  }
}

module.exports = ResourceElement;
