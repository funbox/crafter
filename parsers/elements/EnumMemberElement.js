const Refract = require('../../Refract');

class EnumMemberElement {
  constructor(name, description, type, isSample) {
    this.name = name;
    this.sample = isSample ? name : null;
    this.description = description;
    this.type = type;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements[this.type || 'string'],
      attributes: {
        ...(this.sample ? {} : {
          typeAttributes: {
            element: Refract.elements.array,
            content: [{
              element: Refract.elements.string,
              content: 'fixed',
            }],
          },
        }),
        ...(this.sourceMap ? { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) } : {}),
      },
    };

    if (this.sample) {
      result.attributes.samples = {
        element: Refract.elements.array,
        content: [{
          element: this.type,
          content: this.sample,
        }],
      };
    } else {
      result.content = this.name;
    }

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) },
          } : {}),
        },
      };
    }

    return result;
  }
}

module.exports = EnumMemberElement;
