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

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.member,
      content: {
        key: this.name.toRefract(sourceMapsEnabled),
        value: this.value.toRefract(sourceMapsEnabled),
      },
    };

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }


    if (this.descriptionEl) {
      result.meta = {
        description: this.descriptionEl.toRefract(sourceMapsEnabled),
      };
    }

    return result;
  }

  getBody(resolvedTypes, namedTypesChain = []) {
    const key = this.name.string;
    const value = this.value.getBody(resolvedTypes, namedTypesChain);

    return {
      [key]: value,
    };
  }

  getSchema(resolvedTypes, flags = {}) {
    const schema = {};

    const [valueSchema, usedTypes] = this.value.getSchema(resolvedTypes, utils.mergeFlags(flags, this, { propagateFixedType: false }));

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

    return [schema, usedTypes];
  }
}

module.exports = PropertyMemberElement;
