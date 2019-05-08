const Refract = require('../../Refract');

class ResourcePrototypeElement {
  constructor(title, basePrototypes = []) {
    this.title = title;
    this.responses = [];
    this.basePrototypes = basePrototypes;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.resourcePrototype,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) },
          } : {}),
        },
      },
      content: this.responses.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (this.basePrototypes.length > 0) {
      result.meta.basePrototypes = {
        element: Refract.elements.array,
        content: this.basePrototypes.map(bp => ({
          element: Refract.elements.string,
          content: bp,
        })),
      };
    }

    return result;
  }
}

module.exports = ResourcePrototypeElement;
