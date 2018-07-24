const Refract = require('../../Refract');
const ValueMemberElement = require('./ValueMemberElement');
const utils = require('../../utils');

class PropertyMemberElement {
  constructor(name, type, example, typeAttributes, description) {
    this.name = name;
    this.value = new ValueMemberElement(type, [], example);

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
        value: this.value.toRefract(),
      },
    };

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (this.description) {
      result.meta = utils.descriptionToRefract(this.description);
    }

    return result;
  }
}

module.exports = PropertyMemberElement;
