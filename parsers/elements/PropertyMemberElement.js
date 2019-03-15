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

  getBody(resolvedTypes) {
    const key = this.name.string;
    const valueObj = this.value.getBody(resolvedTypes);
    const value = valueObj.value !== undefined ? valueObj.value : valueObj;

    const body = {
      [key]: value,
    };
    return body;
  }

  getSchema(resolvedTypes, flags = {}) {
    const schema = {};

    const valueSchema = this.value.getSchema(resolvedTypes, utils.mergeFlags(flags, this));

    if (this.descriptionEl) {
      valueSchema.description = this.descriptionEl.string;
    }

    schema.properties = {
      [this.name.string]: valueSchema,
    };

    if (
      (flags.isFixed || flags.isFixedType || this.typeAttributes.includes('required'))
      && !this.typeAttributes.includes('optional')
    ) {
      schema.required = [this.name.string];
    }

    if (flags.isFixed || flags.isFixedType) {
      schema.additionalProperties = false;
    }

    return schema;
  }
}

module.exports = PropertyMemberElement;
