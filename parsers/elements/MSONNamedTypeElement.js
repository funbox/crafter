const Refract = require('../../Refract');

const ValueMemberElement = require('./ValueMemberElement');

class MSONNamedTypeElement {
  constructor(name, baseType, typeAttributes) {
    this.name = name;
    this.content = new ValueMemberElement(baseType, typeAttributes);
  }

  toRefract() {
    const result = {
      element: Refract.elements.dataStructure,
      content: Object.assign(this.content.toRefract(), {
        meta: {
          id: this.name.toRefract(),
        },
      }),
    };

    if (this.description) {
      result.content.meta.description = {
        element: Refract.elements.string,
        content: this.description.description,
      };
    }

    return result;
  }
}

module.exports = MSONNamedTypeElement;
