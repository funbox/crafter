const utils = require('../../utils');

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
 */
class ArrayElement {
  /**
   *
   * @param {ValueMemberElement[]} members - вложенные типы данных, например для array[string] это string
   */
  constructor(members) {
    this.members = members;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.members.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   *
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain
   */
  getBody(resolvedTypes, namedTypesChain = []) {
    return this.members.map(member => member.getBody(resolvedTypes, namedTypesChain));
  }

  /**
   *
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {object} flags - флаги генерации JSON Schema
   * @param {boolean} flags.isFixed
   * @param {boolean} flags.isFixedType
   * @param {boolean} flags.isNullable
   * @param {boolean} flags.skipTypesInlining
   */
  getSchema(resolvedTypes, flags = {}) {
    const schema = { type: 'array' };
    const localFlags = { ...flags };
    delete localFlags.isFixedType;
    localFlags.skipTypesInlining = true;
    const usedTypes = [];
    if (flags.isFixed) {
      schema.minItems = this.members.length;
      const memberSchemas = [];

      this.members.forEach(member => {
        const [currentMemberSchema, currentMemberUsedTypes] = member.getSchema(resolvedTypes, localFlags);
        memberSchemas.push(currentMemberSchema);
        usedTypes.push(...currentMemberUsedTypes);
      });
      schema.items = memberSchemas;
      schema.additionalItems = false;
    } else if (this.members.length > 1) {
      const memberSchemas = [];

      this.members.forEach(member => {
        const [currentMemberSchema, currentMemberUsedTypes] = member.getSchema(resolvedTypes, localFlags);
        memberSchemas.push(currentMemberSchema);
        usedTypes.push(...currentMemberUsedTypes);
      });

      const items = utils.uniquifySchemas(memberSchemas);
      schema.items = {
        anyOf: items,
      };
    } else if (this.members.length === 1) {
      const [memberSchema, memberUsedTypes] = this.members[0].getSchema(resolvedTypes, localFlags);
      schema.items = memberSchema;
      usedTypes.push(...memberUsedTypes);
    }
    return [schema, usedTypes];
  }
}

module.exports = ArrayElement;
