const Refract = require('../../Refract');

const ValueMemberElement = require('./ValueMemberElement');
const StringElement = require('./StringElement');

class MSONNamedTypeElement {
  constructor(name, baseType, typeAttributes) {
    this.name = name instanceof StringElement ? name : new StringElement(name);
    this.content = new ValueMemberElement(baseType, typeAttributes);
  }

  toRefract() {
    return {
      element: Refract.elements.dataStructure,
      content: Object.assign(this.content.toRefract(), {
        meta: {
          id: this.name.toRefract(),
        },
      }),
    };
  }
}

module.exports = MSONNamedTypeElement;
