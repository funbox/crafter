const Refract = require('../../Refract');

class BlueprintElement {
  constructor(title, description, meta) {
    this.title = title;
    this.description = description;
    this.content = [];
    this.meta = meta;
  }

  toRefract() {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [{
          element: Refract.elements.string,
          content: Refract.categoryClasses.api,
        }],
        title: this.title.toRefract(),
      },
      content: this.content.map(item => item.toRefract()),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract());
    }

    if (this.meta.length) {
      result.attributes = {
        metadata: {
          element: Refract.elements.array,
          content: this.meta.map(metaElement => metaElement.toRefract()),
        },
      };
    }

    return {
      element: Refract.elements.parseResult,
      content: [result],
    };
  }
}

module.exports = BlueprintElement;
