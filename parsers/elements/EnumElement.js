const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');
const MSONMixinElement = require('./MSONMixinElement');

/**
 * Enum (перечисление)
 *
 * Пример:
 *
 * исходный текст:
 * + kind (enum)
 *   + track
 *   + movement
 *
 * дерево:
 * PropertyMemberElement
 *   value: ValueMemberElement
 *     content: EnumElement <--
 *       members:
 *         - EnumMemberElement
 *         - EnumMemberElement
 */
class EnumElement {
  /**
   * @param {string} type - строка вида enum[Type], в качестве Type могут быть только примитивные типы
   */
  constructor(type) {
    const resolvedType = utils.resolveType(type);

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
    this.type = (resolvedType.nestedTypes[0] ? resolvedType.nestedTypes[0] : 'string');
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
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain - использованные в процессе генерации body именованные типы, нужны для отслеживания рекурсивных структур
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
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   * @param {string[]} namedTypesChain - использованные в процессе генерации schema именованные типы, нужны для отслеживания рекурсивных структур
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
    return [schema, usedTypes];
  }
}

EnumElement.validEnumMemberTypes = ['string', 'number', 'boolean'];

module.exports = EnumElement;
