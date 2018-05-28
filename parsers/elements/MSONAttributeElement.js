const Refract = require('../../Refract');

class MSONAttributeElement {
  constructor(name, example, type, typeAttributes, description) {
    this.name = name;
    this.example = example;
    this.type = type || 'string';
    this.typeAttributes = typeAttributes;
    this.description = description;
  }

  toRefract() {
    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: 'string',
          content: this.name,
        },
        value: {
          element: this.type,
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

    return result;
  }
}

module.exports = MSONAttributeElement;