const Refract = require('../../Refract');

class BlueprintElement {
  constructor(title, description) {
    this.title = title;
    this.description = description;
    this.content = [];
  }

  toRefract() {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [{
          element: Refract.elements.string,
          content: Refract.categoryClasses.api,
        }],
        title: {
          element: Refract.elements.string,
          content: this.title,
        },
      },
      content: this.content.map(item => item.toRefract()),
    };

    if (this.description) {
      result.content.push({
        element: Refract.elements.copy,
        content: this.description,
      });
    }

    return {
      element: Refract.elements.parseResult,
      content: [result],
    };
  }
}

module.exports = BlueprintElement;
