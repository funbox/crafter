const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * Field of an object
 *
 * Example:
 *
 * + Attributes
 *   + foo
 *
 * resulting tree:
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
   * @param {(string|Array)[]} typeAttributes - a set of attributes "required" and/or "optional"
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
   * @param {boolean} isFixed - resulting AST will be modified if one of the parent elements has the "fixed" attribute
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
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {string[]} namedTypesChain - named types used in the Body generation process are applicable to track recursive structures
   */
  getBody(dataTypes, namedTypesChain = []) {
    const key = this.name.string;
    const value = this.value.getBody(dataTypes, namedTypesChain);

    return {
      [key]: value,
    };
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   * @param {string[]} namedTypesChain - named types used in the Schema generation process are applicable to track recursive structures
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

    schema.type = 'object';

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
