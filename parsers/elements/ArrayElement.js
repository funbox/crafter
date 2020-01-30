const utils = require('../../utils');
const Flags = require('../../Flags');

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

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed - наличие флага fixed у одного из родительских элементов, влияет на результирующий AST
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.members.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain
   */
  getBody(resolvedTypes, namedTypesChain = []) {
    return this.members.map(member => member.getBody(resolvedTypes, namedTypesChain));
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(resolvedTypes, flags = new Flags()) {
    const schema = { type: 'array' };
    const localFlags = new Flags(flags);
    localFlags.isFixedType = false;
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
