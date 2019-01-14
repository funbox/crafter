class ArrayElement {
  constructor(members) {
    this.members = members;
  }

  toRefract() {
    return this.members.map(element => element.toRefract());
  }

  getSchema(resolvedTypes, flags = {}) {
    const schema = { type: 'array' };
    if (this.members.length > 1) {
      schema.items = {
        anyOf: this.members.map(member => member.getSchema(resolvedTypes, flags)),
      };
    } else if (this.members.length === 1) {
      schema.items = this.members[0].getSchema(resolvedTypes, flags);
    }
    return schema;
  }
}

module.exports = ArrayElement;
