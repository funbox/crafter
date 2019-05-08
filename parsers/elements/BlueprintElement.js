const Refract = require('../../Refract');

class BlueprintElement {
  constructor(title, description, meta) {
    this.title = title;
    this.description = description;
    this.content = [];
    this.annotations = [];
    this.meta = meta;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [{
          element: Refract.elements.string,
          content: Refract.categoryClasses.api,
        }],
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: this.content.map(item => item.toRefract(sourceMapsEnabled)),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (this.meta.length) {
      result.attributes = {
        metadata: {
          element: Refract.elements.array,
          content: this.meta.map(metaElement => metaElement.toRefract(sourceMapsEnabled)),
        },
      };
    }

    return {
      element: Refract.elements.parseResult,
      content: [result].concat(this.annotations.map(annotation => annotation.toRefract(sourceMapsEnabled))),
    };
  }
}

module.exports = BlueprintElement;
