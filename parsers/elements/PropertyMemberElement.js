const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

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
   * @param {(string|Array)[]} typeAttributes - набор атрибутов "required" и/или "optional"
   * @param {StringElement} descriptionEl
   * @param {SourceMapElement} sourceMap
   */
  constructor(name, value, typeAttributes, descriptionEl, sourceMap) {
    this.name = name;
    this.value = value;

    this.typeAttributes = typeAttributes;
    this.descriptionEl = descriptionEl;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed - наличие флага fixed у одного из родительских элементов, влияет на результирующий AST
   */
  toRefract(sourceMapsEnabled, isFixed) {
    const isFixedPropagated = this.value.propagatedTypeAttributes && this.value.propagatedTypeAttributes.includes('fixed');
    const result = {
      element: Refract.elements.member,
      content: {
        key: this.name.toRefract(sourceMapsEnabled),
        value: this.value.toRefract(sourceMapsEnabled, isFixed || this.value.typeAttributes.includes('fixed') || isFixedPropagated),
      },
    };

    if (this.typeAttributes.length) {
      result.attributes = utils.typeAttributesToRefract(this.typeAttributes);
    }

    if (sourceMapsEnabled) {
      result.attributes = result.attributes || {};
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes.sourceMap = sourceMapEl.toRefract();
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
   * @param {string[]} namedTypesChain - использованные в процессе генерации schema именованные типы, нужны для отслеживания рекурсивных структур
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    const schema = {};

    const [valueSchema, usedTypes] = this.value.getSchema(dataTypes, utils.mergeFlags(flags, this.value, { propagateFixedType: false }), namedTypesChain);

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
