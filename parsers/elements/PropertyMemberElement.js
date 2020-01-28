const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');

/**
 * Поле объекта
 *
 * Пример:
 *
 * + Attributes
 *   + foo
 *
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     content: ObjectElement
 *       propertyMembers:
 *         - PropertyMemberElement <--
 *
 * @see https://apielements.org/en/latest/element-definitions.html#member-element
 */
class PropertyMemberElement {
  /**
   * @param {StringElement} name
   * @param {ValueMemberElement} value
   * @param {(string|Array)[]}typeAttributes
   * @param {StringElement} descriptionEl
   */
  constructor(name, value, typeAttributes, descriptionEl) {
    this.name = name;
    this.value = value;

    this.typeAttributes = typeAttributes;
    this.descriptionEl = descriptionEl;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed
   */
  toRefract(sourceMapsEnabled, isFixed) {
    const result = {
      element: Refract.elements.member,
      content: {
        key: this.name.toRefract(sourceMapsEnabled),
        value: this.value.toRefract(sourceMapsEnabled, isFixed || this.typeAttributes.includes('fixed')),
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

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain
   */
  getBody(resolvedTypes, namedTypesChain = []) {
    const key = this.name.string;
    const value = this.value.getBody(resolvedTypes, namedTypesChain);

    return {
      [key]: value,
    };
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(resolvedTypes, flags = new Flags()) {
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
