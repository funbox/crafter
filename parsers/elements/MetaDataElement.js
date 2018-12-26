const Refract = require('../../Refract');

class MetaDataElement {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }

  toRefract() {
    return {
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
  }
}

module.exports = MetaDataElement;
