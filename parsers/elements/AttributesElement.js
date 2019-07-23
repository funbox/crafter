const Refract = require('../../Refract');
const utils = require('../../utils');

class AttributesElement {
  constructor(content) {
    this.content = content;
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.dataStructure,
      content: this.content.toRefract(sourceMapsEnabled),
    };
  }

  getBody(resolvedTypes) {
    return this.content.getBody(resolvedTypes);
  }

  getSchema(resolvedTypes, flags = {}) {
    const result = this.content.getSchema(resolvedTypes, utils.mergeFlags(flags, this.content));

    if (result) {
      return {
        $schema: 'http://json-schema.org/draft-04/schema#',
        ...result,
      };
    }

    return result;
  }
}

module.exports = AttributesElement;
