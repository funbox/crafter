const utils = require('../../utils');

class ArrayElement {
  constructor(members) {
    this.members = members;
  }

  toRefract(sourceMapsEnabled) {
    return this.members.map(element => element.toRefract(sourceMapsEnabled));
  }

  getBody(resolvedTypes, namedTypesChain = []) {
    return this.members.map(member => member.getBody(resolvedTypes, namedTypesChain));
  }

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
