const Refract = require('../../Refract');

class ParameterEnumMemberElement {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.string,
      content: this.name,
    };

    if (this.sourceMap) {
      result.attributes = {
        sourceMap: this.sourceMap.toRefract(),
      };
    }

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

module.exports = ParameterEnumMemberElement;