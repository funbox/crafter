const Refract = require('../../Refract');

class SubgroupElement {
  constructor(title) {
    this.title = title;
    this.description = null;
    this.messages = [];
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.subGroup,
          }],
        },
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: this.messages.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = SubgroupElement;
