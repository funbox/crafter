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
   * @param {(string|Array)[]} typeAttributes - набор атрибутов типа fixed, required, ["minimum", 10]
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
   * @param {boolean} isFixed - наличие флага fixed у одного из родительских элементов, влияет на результирующий AST
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
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain - использованные в процессе генерации body именованные типы, нужны для отслеживания рекурсивных структур
   */
  getBody(dataTypes, namedTypesChain = []) {
    const key = this.name.string;
    const value = this.value.getBody(dataTypes, namedTypesChain);

    return {
      [key]: value,
    };
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    const schema = {};

    const [valueSchema, usedTypes] = this.value.getSchema(dataTypes, utils.mergeFlags(flags, this, { propagateFixedType: false }), namedTypesChain);

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
