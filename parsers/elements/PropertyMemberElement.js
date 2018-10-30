const Refract = require('../../Refract');
const ValueMemberElement = require('./ValueMemberElement');
const StringElement = require('./StringElement');
const utils = require('../../utils');

class PropertyMemberElement {
  constructor(name, value = new ValueMemberElement(), typeAttributes = [], description) {
    this.name = name instanceof StringElement ? name : new StringElement(name);
    this.value = value;

    this.typeAttributes = typeAttributes;
    this.description = description;
  }

  toRefract() {
    const result = {
      element: Refract.elements.member,
      content: {
        key: this.name.toRefract(),
        value: this.value.toRefract(),
      },
    };

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }


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

  getSchema(resolvedTypes) {
    const schema = {};

    const valueSchema = this.value.getSchema(resolvedTypes, {
      isFixed: this.typeAttributes.includes('fixed'),
      isNullable: this.typeAttributes.includes('nullable'),
    });

    if (this.description) {
      valueSchema.description = this.description;
    }

    schema.properties = {
      [this.name.string]: valueSchema,
    };

    if (this.typeAttributes.includes('required')) {
      schema.required = [this.name.string];
    }

    return schema;
  }
}

module.exports = PropertyMemberElement;
