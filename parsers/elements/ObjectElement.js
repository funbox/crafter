const utils = require('../../utils');

class ObjectElement {
  constructor() {
    this.propertyMembers = [];
  }

  toRefract(sourceMapsEnabled) {
    return this.propertyMembers.map(element => element.toRefract(sourceMapsEnabled));
  }

  getBody(resolvedTypes, namedTypesChain = []) {
    return this.propertyMembers.reduce((body, member) => ({
      ...body,
      ...member.getBody(resolvedTypes, namedTypesChain),
    }), {});
  }

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
