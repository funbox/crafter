const utilsHelpers = require('../../utils/index');
const types = require('../../types');
const Flags = require('../../Flags');
const MSONMixinElement = require('./MSONMixinElement');

/**
 * Массив
 *
 * Пример:
 *
 * исходный текст:
 * + Attributes
 *   + foo (array[string])
 *
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     content: ObjectElement
 *       propertyMembers:
 *         - PropertyMemberElement
 *           value: ValueMemberElement
 *             content: ArrayElement <--
 *               members:
 *                 - ValueMemberElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#array-element
 */
class ArrayElement {
  /**
   *
   * @param {ValueMemberElement[]} members - вложенные типы данных, например для array[string] это string
   */
  constructor(members) {
    this.members = members;
  }

  isComplex() {
    return this.members.some(member => member.type && !types.primitiveTypes.includes(member.type));
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed - наличие флага fixed у одного из родительских элементов влияет на результирующий AST
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.members.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain - использованные в процессе генерации body именованные типы, нужны для отслеживания рекурсивных структур
   */
  getBody(dataTypes, namedTypesChain = []) {
    return this.members.reduce((acc, member) => {
      const memberBody = member.getBody(dataTypes, namedTypesChain);
      if (member instanceof MSONMixinElement && Array.isArray(memberBody)) {
        return [...acc, ...memberBody];
      }
      return [...acc, memberBody];
    }, []);
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   * @param {string[]} namedTypesChain - использованные в процессе генерации schema именованные типы, нужны для отслеживания рекурсивных структур
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    const schema = { type: 'array' };
    const localFlags = new Flags(flags);
    localFlags.isFixedType = false;
    localFlags.skipTypesInlining = true;
    const usedTypes = [];
    if (flags.isFixed) {
      const memberSchemas = [];

      this.members.forEach(member => {
        const [currentMemberSchemas, currentMemberUsedTypes] = getArrayMemberSchema(member, dataTypes, localFlags, namedTypesChain);
        memberSchemas.push(...currentMemberSchemas);
        usedTypes.push(...currentMemberUsedTypes);
      });
      schema.minItems = memberSchemas.length;
      schema.items = memberSchemas;
      schema.additionalItems = false;
    } else if (this.members.length > 1) {
      const memberSchemas = [];

      this.members.forEach(member => {
        const [currentMemberSchemas, currentMemberUsedTypes] = getArrayMemberSchema(member, dataTypes, localFlags, namedTypesChain);
        memberSchemas.push(...currentMemberSchemas);
        usedTypes.push(...currentMemberUsedTypes);
      });

      schema.items = {
        anyOf: utilsHelpers.uniquifySchemas(memberSchemas),
      };
    } else if (this.members.length === 1) {
      // единственным элементом может оказаться MSONMixinElement, который скрывает в себе несколько элементов
      const [memberSchemas, memberUsedTypes] = getArrayMemberSchema(this.members[0], dataTypes, localFlags, namedTypesChain);
      schema.items = memberSchemas.length === 1 ? memberSchemas[0] : { anyOf: utilsHelpers.uniquifySchemas(memberSchemas) };
      usedTypes.push(...memberUsedTypes);
    }
    return [schema, usedTypes];
  }
}

module.exports = ArrayElement;

function getArrayMemberSchema(member, dataTypes, localFlags, namedTypesChain) {
  const [
    currentMemberSchema,
    currentMemberUsedTypes,
  ] = member.getSchema(dataTypes, utilsHelpers.mergeFlags(localFlags, member), namedTypesChain);

  if (member instanceof MSONMixinElement && currentMemberSchema.type === 'array') {
    if (currentMemberSchema.items === undefined) {
      return [[], currentMemberUsedTypes];
    }
    if (Array.isArray(currentMemberSchema.items)) {
      return [currentMemberSchema.items, currentMemberUsedTypes];
    }
    if (currentMemberSchema.items && Array.isArray(currentMemberSchema.items.anyOf)) {
      return [currentMemberSchema.items.anyOf, currentMemberUsedTypes];
    }
    return [[currentMemberSchema.items], currentMemberUsedTypes];
  }

  return [[currentMemberSchema], currentMemberUsedTypes];
}
