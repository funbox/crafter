const Refract = require('../../Refract');
const utils = require('../../utils');

class OneOfTypeOptionElement {
  constructor(members = []) {
    this.members = members;
  }

  toRefract() {
    return {
      element: Refract.elements.option,
      content: this.members.map(member => member.toRefract()),
    };
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
