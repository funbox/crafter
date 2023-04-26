const utils = require('../../utils');
const Flags = require('../../Flags');

/**
 * Object
 *
 * Example:
 *
 * + Attributes
 *   + foo
 *
 * resulting tree:
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
   * @param {boolean} isFixed - resulting AST will be modified if one of the parent elements has the "fixed" attribute
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.propertyMembers.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {string[]} namedTypesChain - named types used in the Body generation process are applicable to track recursive structures
   */
  getBody(dataTypes, namedTypesChain = []) {
    return this.propertyMembers.reduce((body, member, index) => ({
      ...body,
      ...member.getBody(dataTypes, namedTypesChain, index),
    }), {});
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   * @param {string[]} namedTypesChain - named types used in the Schema generation process are applicable to track recursive structures
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
}

module.exports = ObjectElement;
