const Refract = require('../../Refract');
const utils = require('../../utils');

class OneOfTypeOptionElement {
  constructor(members = []) {
    this.members = members;
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.option,
      content: this.members.map(member => member.toRefract(sourceMapsEnabled)),
    };
  }

  getBody(resolvedTypes) {
    let body = {};
    this.members.forEach(member => {
      body = utils.mergeBodies(body, member.getBody(resolvedTypes));
    });

    return body;
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = {};
    this.members.forEach(member => {
      schema = utils.mergeSchemas(schema, member.getSchema(resolvedTypes, flags));
    });
    return schema;
  }
}

module.exports = OneOfTypeOptionElement;
