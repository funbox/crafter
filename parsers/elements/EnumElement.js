const Refract = require('../../Refract');
const Flags = require('../../Flags');
const MSONMixinElement = require('./MSONMixinElement');

/**
 * Enum (enumerable value)
 *
 * Example:
 *
 * source lines:
 * + kind (enum)
 *   + track
 *   + movement
 *
 * resulting tree:
 * PropertyMemberElement
 *   value: ValueMemberElement
 *     content: EnumElement <--
 *       members:
 *         - EnumMemberElement
 *         - EnumMemberElement
 */
class EnumElement {
  /**
   * @param {string[]} nestedTypes - possible enum types
   */
  constructor(nestedTypes) {
    /**
     * @type {EnumMemberElement[]}
     */
    this.members = [];
    /**
     * @type {DefaultValueElement}
     */
    this.defaultValue = null;
    /**
     * @type {SampleValueElement[]}
     */
    this.sampleValues = [];
    this.type = (nestedTypes[0] ? nestedTypes[0] : 'string');
  }

  isComplex() {
    return !EnumElement.validEnumMemberTypes.includes(this.type);
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      enumerations: {
        element: Refract.elements.array,
        content: this.members.map(e => e.toRefract(sourceMapsEnabled)),
      },
    };

    if (this.defaultValue) {
      result.default = this.defaultValue.toRefract(sourceMapsEnabled);
    }

    if (this.sampleValues.length) {
      result.samples = {
        element: Refract.elements.array,
        content: this.sampleValues.map(sampleElement => sampleElement.toRefract(sourceMapsEnabled)),
      };
    }
    return result;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {string[]} namedTypesChain - named types used in the Body generation process are applicable to track recursive structures
   */
  getBody(dataTypes, namedTypesChain = []) {
    if (this.defaultValue) {
      return this.defaultValue.value;
    }

    if (this.members.length) {
      return this.members[0].getBody(dataTypes, namedTypesChain);
    }

    if (this.sampleValues.length) {
      return this.sampleValues[0].getBody(dataTypes, namedTypesChain);
    }

    return undefined;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   * @param {string[]} namedTypesChain - named types used in the Schema generation process are applicable to track recursive structures
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    const usedTypes = [];
    const schema = {
      type: this.type,
      enum: this.members.reduce((acc, member) => {
        const [memberSchema] = member.getSchema(dataTypes, flags, namedTypesChain);
        if (member instanceof MSONMixinElement && Array.isArray(memberSchema.enum)) {
          return [...acc, ...memberSchema.enum];
        }
        return [...acc, memberSchema];
      }, []),
    };
    if (this.defaultValue) {
      schema.default = this.defaultValue.value;
    }
    if (flags.isNullable) {
      schema.enum = schema.enum.concat([null]);
    }
    return [schema, usedTypes];
  }
}

EnumElement.validEnumMemberTypes = ['string', 'number', 'boolean'];

module.exports = EnumElement;
