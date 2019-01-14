const utils = require('../../utils');

class ObjectElement {
  constructor() {
    this.propertyMembers = [];
  }

  toRefract() {
    return this.propertyMembers.map(element => element.toRefract());
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = { type: 'object' };
    this.propertyMembers.forEach(member => {
      schema = utils.mergeSchemas(schema, member.getSchema(resolvedTypes, flags));
    });
    return schema;
  }
}

module.exports = ObjectElement;
