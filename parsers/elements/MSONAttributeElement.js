const Refract = require('../../Refract');

class MSONAttributeElement {
  constructor(name, example, type, typeAttributes, description) {
    this.name = name;
    this.example = example;
    this.type = type;
    this.typeAttributes = typeAttributes;
    this.description = description;
    this.object = null;
  }

  toRefract() {
    let type = this.type || (this.object ? 'object' : 'string');

    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: 'string',
          content: this.name,
        },
        value: {
          element: type,
        }
      },
    };

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
        }
      };
    }

    if (this.typeAttributes.length) {
      result.attributes = {
        typeAttributes: this.typeAttributes.map(a => ({
          element: Refract.elements.string,
          content: a,
        }))
      };
    }

    if (this.example) {
      result.content.value.content = this.example;
    }

    if (this.object) {
      result.content.value = this.object.toRefract();
    }

    return result;
  }
}

module.exports = MSONAttributeElement;