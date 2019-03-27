class ArrayElement {
  constructor(members) {
    this.members = members;
  }

  toRefract() {
    return this.members.map(element => element.toRefract());
  }

  getBody(resolvedTypes, options) {
    const hasSamples = options && options.hasSamples;
    const body = {
      value: [],
    };
    if (hasSamples) return body;
    this.members.forEach(member => {
      const memberBody = member.getBody(resolvedTypes);
      body.value.push(memberBody.value !== undefined ? memberBody.value : memberBody);
    });
    return body;
  }

  getSchema(resolvedTypes, flags = {}) {
    const schema = { type: 'array' };
    if (flags.isFixed) {
      schema.minItems = this.members.length;
      schema.items = this.members.map(member => member.getSchema(resolvedTypes, flags));
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
      schema.items = this.members[0].getSchema(resolvedTypes, flags);
    }
    return schema;
  }
}

module.exports = ArrayElement;
