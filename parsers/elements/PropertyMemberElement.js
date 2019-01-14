const Refract = require('../../Refract');
const ValueMemberElement = require('./ValueMemberElement');
const StringElement = require('./StringElement');
const utils = require('../../utils');

class PropertyMemberElement {
  constructor(name, value = new ValueMemberElement(), typeAttributes = [], descriptionEl) {
    this.name = name instanceof StringElement ? name : new StringElement(name);
    this.value = value;

    this.typeAttributes = typeAttributes;
    this.descriptionEl = descriptionEl;
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


    if (this.descriptionEl) {
      result.meta = {
        description: this.descriptionEl.toRefract(),
      };
    }

    return result;
  }

  getSchema(resolvedTypes, flags = {}) {
    const schema = {};

    const valueSchema = this.value.getSchema(resolvedTypes, {
      isFixed: flags.isFixed || this.typeAttributes.includes('fixed'),
      isNullable: this.typeAttributes.includes('nullable'),
    });

    if (this.descriptionEl) {
      valueSchema.description = this.descriptionEl.string;
    }

    schema.properties = {
      [this.name.string]: valueSchema,
    };

    if (flags.isFixed || this.typeAttributes.includes('required')) {
      schema.required = [this.name.string];
    }

    if (flags.isFixed) {
      schema.additionalProperties = false;
    }

    return schema;
  }
}

module.exports = PropertyMemberElement;
