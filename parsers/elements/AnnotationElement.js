const Refract = require('../../Refract');

class AnnotationElement {
  constructor(type, text, sourceMap) {
    this.type = type;
    this.text = text;
    this.sourceMap = sourceMap;
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.annotation,
      meta: {
        classes: {
          element: 'array',
          content: [
            {
              element: 'string',
              content: this.type,
            },
          ],
        },
      },
      attributes: {
        sourceMap: this.sourceMap.toRefract(sourceMapsEnabled),
      },
      content: this.text,
    };
  }
}

module.exports = AnnotationElement;
