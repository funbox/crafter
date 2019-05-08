const Refract = require('../../Refract');

const ValueMemberElement = require('./ValueMemberElement');

class MSONNamedTypeElement {
  constructor(name, baseType, typeAttributes) {
    this.name = name;
    this.content = new ValueMemberElement(baseType, typeAttributes);
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.dataStructure,
      content: Object.assign(this.content.toRefract(sourceMapsEnabled), {
        meta: {
          id: this.name.toRefract(sourceMapsEnabled),
        },
      }),
    };

    if (this.description) {
      const description = {
        element: Refract.elements.string,
        content: this.description.description,
      };
      if (sourceMapsEnabled && this.description.sourceMap) {
        description.attributes = {
          sourceMap: this.description.sourceMap.toRefract(sourceMapsEnabled),
        };
      }
      result.content.meta.description = description;
    }

    return result;
  }
}

module.exports = MSONNamedTypeElement;
