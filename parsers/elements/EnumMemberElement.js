const Refract = require('../../Refract');

class EnumMemberElement {
  constructor(name, description, type) {
    this.name = name;
    this.description = description;
    this.type = type;
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements[this.type || 'string'],
      attributes: {
        typeAttributes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: 'fixed',
          }],
        },
        ...(this.sourceMap ? { sourceMap: this.sourceMap.toRefract() } : {}),
      },
      content: this.name,
    };

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract() },
          } : {}),
        },
      };
    }

    return result;
  }
}

module.exports = EnumMemberElement;
