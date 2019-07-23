class ArrayElement {
  constructor(members) {
    this.members = members;
  }

  toRefract(sourceMapsEnabled) {
    return this.members.map(element => element.toRefract(sourceMapsEnabled));
  }

  getBody(resolvedTypes) {
    return this.members.map(member => member.getBody(resolvedTypes));
  }

  getSchema(resolvedTypes, flags = {}) {
    const schema = { type: 'array' };
    const localFlags = { ...flags };
    delete localFlags.isFixedType;

    if (flags.isFixed) {
      schema.minItems = this.members.length;
      schema.items = this.members.map(member => member.getSchema(resolvedTypes, localFlags));
      schema.additionalItems = false;
    } else if (this.members.length > 1) {
      const map = new Map();
      this.members.forEach(member => {
        const memberSchema = member.getSchema(resolvedTypes);
        const stringifiedSchema = JSON.stringify(memberSchema);
        if (!map.has(stringifiedSchema)) {
          map.set(stringifiedSchema, memberSchema);
        }
      });
      const items = Array.from(map.values());
      schema.items = {
        anyOf: items,
      };
    } else if (this.members.length === 1) {
      schema.items = this.members[0].getSchema(resolvedTypes, localFlags);
    }
    return schema;
  }
}

module.exports = ArrayElement;
