const Refract = require('../../Refract');

class ResourceGroupElement {
  constructor(title) {
    this.title = title;
    this.description = null;
    this.resources = [];
  }

  toRefract() {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [Refract.categoryClasses.resourceGroup],
        title: this.title.toRefract(),
      },
      content: this.resources.map(r => r.toRefract()),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract());
    }

    return result;
  }
}

module.exports = ResourceGroupElement;
