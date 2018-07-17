const Refract = require('../../Refract');

class EnumMemberElement {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  toRefract() {
    const result = {
      element: Refract.elements.string,
      attributes: {
        typeAttributes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: 'fixed',
          }],
        },
      },
      content: this.name,
    };

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
        },
      };
    }

    return result;
  }
}

module.exports = EnumMemberElement;
