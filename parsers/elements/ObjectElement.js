const utils = require('../../utils');
const Flags = require('../../Flags');

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
   * @param {boolean} isFixed - наличие флага fixed у одного из родительских элементов, влияет на результирующий AST
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.propertyMembers.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain - использованные в процессе генерации body именованные типы, нужны для отслеживания рекурсивных структур
   */
  getBody(dataTypes, namedTypesChain = []) {
    return this.propertyMembers.reduce((body, member, index) => ({
      ...body,
      ...member.getBody(dataTypes, namedTypesChain, index),
    }), {});
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   * @param {string[]} namedTypesChain - использованные в процессе генерации schema именованные типы, нужны для отслеживания рекурсивных структур
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    let schema = { type: 'object' };
    const usedTypes = [];
    this.propertyMembers.forEach(member => {
      const [memberSchema, memberUsedTypes] = member.getSchema(dataTypes, flags, namedTypesChain);
      schema = utils.mergeSchemas(schema, memberSchema);
      usedTypes.push(...memberUsedTypes);
    });
    if (flags.isFixed || flags.isFixedType) {
      schema.additionalProperties = false;
    }
    return [schema, usedTypes];
  }

  getOptionalMembers() {
    return this.propertyMembers.filter(member => (
      Array.isArray(member.typeAttributes) && member.typeAttributes.includes('optional')
    ));
  }

  getRequiredMembers() {
    return this.propertyMembers.filter(member => (
      Array.isArray(member.typeAttributes) && member.typeAttributes.includes('required')
    ));
  }
}

module.exports = ObjectElement;
