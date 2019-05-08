const Refract = require('../../Refract');

class MetaDataElement {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: Refract.elements.string,
          content: this.key,
        },
        value: {
          element: Refract.elements.string,
          content: this.value,
        },
      },
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: 'user',
          }],
        },
      },
    };

    if (sourceMapsEnabled && this.sourceMap) {
      result.attributes = {
        sourceMap: this.sourceMap.toRefract(sourceMapsEnabled),
      };
    }
    return result;
  }
}

module.exports = MetaDataElement;
