const utils = require('../../utils');
const { types } = require('../../constants');
const Flags = require('../../Flags');
const MSONMixinElement = require('./MSONMixinElement');

/**
 * Array
 *
 * Example:
 *
 * source lines:
 * + Attributes
 *   + foo (array[string])
 *
 * resulting tree:
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
   * @param {ValueMemberElement[]} members - nested data types, e.g. nested type of array[string] is string
   */
  constructor(members) {
    this.members = members;
  }

  isComplex() {
    return this.members.some(member => member.type && !types.primitiveTypes.includes(member.type));
  }

  /**
   * @param {boolean} sourceMapsEnabled
   * @param {boolean} isFixed - resulting AST will be modified if one of the parent elements has the "fixed" attribute
   */
  toRefract(sourceMapsEnabled, isFixed) {
    return this.members.map(element => element.toRefract(sourceMapsEnabled, isFixed));
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {string[]} namedTypesChain - named types used in the Body generation process are applicable to track recursive structures
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
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   * @param {string[]} namedTypesChain - named types used in the Schema generation process are applicable to track recursive structures
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
        anyOf: utils.uniquifySchemas(memberSchemas),
      };
    } else if (this.members.length === 1) {
      // the only element could be MSONMixinElement which substitutes multiple elements
      const [memberSchemas, memberUsedTypes] = getArrayMemberSchema(this.members[0], dataTypes, localFlags, namedTypesChain);
      schema.items = memberSchemas.length === 1 ? memberSchemas[0] : { anyOf: utils.uniquifySchemas(memberSchemas) };
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
  ] = member.getSchema(dataTypes, utils.mergeFlags(localFlags, member), namedTypesChain);

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
