class ArrayElement {
  constructor(members) {
    this.members = members;
  }

  toRefract() {
    return this.members.map(element => element.toRefract());
  }

  getSchema(resolvedTypes) {
    const schema = { type: 'array' };
    if (this.members.length > 1) {
      schema.items = {
        anyOf: this.members.map(member => member.getSchema(resolvedTypes)),
      };
    } else if (this.members.length === 1) {
      schema.items = this.members[0].getSchema(resolvedTypes);
    }
    return schema;
  }
}

module.exports = ArrayElement;
