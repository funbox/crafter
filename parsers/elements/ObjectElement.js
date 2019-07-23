const utils = require('../../utils');

class ObjectElement {
  constructor() {
    this.propertyMembers = [];
  }

  toRefract(sourceMapsEnabled) {
    return this.propertyMembers.map(element => element.toRefract(sourceMapsEnabled));
  }

  getBody(resolvedTypes) {
    return this.propertyMembers.reduce((body, member) => ({
      ...body,
      ...member.getBody(resolvedTypes),
    }), {});
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
