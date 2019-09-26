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
    return this.members.reduce((body, member) => ({
      ...body,
      ...member.getBody(resolvedTypes),
    }), {});
  }

  getSchema(resolvedTypes, flags = {}) {
    let schema = {};
    const usedTypes = [];

    this.members.forEach(member => {
      const [memberSchema, memberUsedTypes] = member.getSchema(resolvedTypes, flags);
      schema = utils.mergeSchemas(schema, memberSchema);
      usedTypes.push(...memberUsedTypes);
    });

    return [schema, usedTypes];
  }
}

module.exports = OneOfTypeOptionElement;
