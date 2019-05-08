const Refract = require('../../Refract');

class ResourceElement {
  constructor(title, href) {
    this.title = title;
    this.href = href;
    this.description = null;
    this.parameters = null;
    this.actions = [];
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.resource,
      meta: {
        title: this.title.toRefract(sourceMapsEnabled),
      },
      attributes: {
        href: this.href.toRefract(sourceMapsEnabled),
      },
      content: this.actions.map(a => a.toRefract(sourceMapsEnabled)),
    };

    if (this.parameters) {
      result.attributes.hrefVariables = this.parameters.toRefract(sourceMapsEnabled);
    }

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = ResourceElement;
