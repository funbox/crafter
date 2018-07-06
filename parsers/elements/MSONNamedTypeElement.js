const Refract = require('../../Refract');

const ValueMemberElement = require('./ValueMemberElement');

class MSONNamedTypeElement {
  constructor(name, baseType, typeAttributes) {
    this.name = name;
    this.content = new ValueMemberElement(baseType, typeAttributes);
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: Object.assign(this.content.toRefract(), {
        meta: {
          id: {
            element: Refract.elements.string,
            content: this.name,
          },
        },
      }),
    };
  }
}

module.exports = MSONNamedTypeElement;
