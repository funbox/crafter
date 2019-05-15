const Refract = require('../../Refract');

class ResourceGroupElement {
  constructor(title) {
    this.title = title;
    this.description = null;
    this.resources = [];
    this.subgroups = [];
  }

  toRefract(sourceMapsEnabled) {
    const content = this.resources.length > this.subgroups.length ? this.resources : this.subgroups;
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [Refract.categoryClasses.resourceGroup],
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: content.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = ResourceGroupElement;
