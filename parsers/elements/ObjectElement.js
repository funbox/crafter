const utils = require('../../utils');

class ObjectElement {
  constructor() {
    this.propertyMembers = [];
  }

  toRefract(sourceMapsEnabled) {
    return this.propertyMembers.map(element => element.toRefract(sourceMapsEnabled));
  }

  getBody(resolvedTypes) {
    let body = {};
    this.propertyMembers.forEach(member => {
      body = utils.mergeBodies(body, member.getBody(resolvedTypes));
    });
    return body;
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = { type: 'object' };
    this.propertyMembers.forEach(member => {
      schema = utils.mergeSchemas(schema, member.getSchema(resolvedTypes, flags));
    });
    if (flags.isFixed || flags.isFixedType) {
      schema.additionalProperties = false;
    }
    return schema;
  }
}

module.exports = ObjectElement;
