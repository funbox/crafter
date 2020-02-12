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
   * @param {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} dataTypes - типы из TypeResolver
   * @param {string[]} namedTypesChain - использованные в процессе генерации body именованные типы, нужны для отслеживания рекурсивных структур
   */
  getBody(dataTypes, namedTypesChain = []) {
    return this.propertyMembers.reduce((body, member) => ({
      ...body,
      ...member.getBody(dataTypes, namedTypesChain),
    }), {});
  }

  /**
   * @param {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(dataTypes, flags = new Flags()) {
    let schema = { type: 'object' };
    const usedTypes = [];
    this.propertyMembers.forEach(member => {
      const [memberSchema, memberUsedTypes] = member.getSchema(dataTypes, flags);
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
