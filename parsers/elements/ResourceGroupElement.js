const Refract = require('../../Refract');

class ResourceGroupElement {
  constructor(title) {
    this.title = title;
    this.resources = [];
  }

  toRefract() {
    return {
      element: Refract.elements.category,
      meta: {
        classes: [Refract.categoryClasses.resourceGroup],
        title: {
          element: Refract.elements.string,
          content: this.title,
        },
      },
      content: this.resources.map(r => r.toRefract()),
    };
  }
}

module.exports = ResourceGroupElement;