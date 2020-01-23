const utils = require('../../utils');

/**
 * Объект
 *
 * Пример:
 *
 * + Attributes
 *   + foo
 *
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     content: ObjectElement <--
 *       propertyMembers:
 *         - PropertyMemberElement
 */
class ObjectElement {
  constructor() {
    /**
     * @type {PropertyMemberElement[]}
     */
    this.propertyMembers = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.propertyMembers.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain
   */
  getBody(resolvedTypes, namedTypesChain = []) {
    return this.propertyMembers.reduce((body, member) => ({
      ...body,
      ...member.getBody(resolvedTypes, namedTypesChain),
    }), {});
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {object} flags - флаги генерации JSON Schema
   * @param {boolean} flags.isFixed
   * @param {boolean} flags.isFixedType
   * @param {boolean} flags.isNullable
   * @param {boolean} flags.skipTypesInlining
   */
  getSchema(resolvedTypes, flags = {}) {
    let schema = { type: 'object' };
    const usedTypes = [];
    this.propertyMembers.forEach(member => {
      const [memberSchema, memberUsedTypes] = member.getSchema(resolvedTypes, flags);
      schema = utils.mergeSchemas(schema, memberSchema);
      usedTypes.push(...memberUsedTypes);
    });
    if (flags.isFixed || flags.isFixedType) {
      schema.additionalProperties = false;
    }
    return [schema, usedTypes];
  }
}

module.exports = ObjectElement;
