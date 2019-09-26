const Refract = require('../../Refract');

class OneOfTypeElement {
  constructor() {
    this.options = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.select,
      content: this.options.map(option => option.toRefract(sourceMapsEnabled)),
    };
  }

  getBody(resolvedTypes) {
    if (this.options.length) {
      return this.options[0].getBody(resolvedTypes);
    }

    return {};
  }

  getSchema(resolvedTypes, flags = {}) {
    const usedTypes = [];
    const schema = {
      oneOf: this.options.map(option => {
        const [optionSchema, optionUsedTypes] = option.getSchema(resolvedTypes, flags);
        usedTypes.push(...optionUsedTypes);
        return optionSchema;
      }),
    };

    return [schema, usedTypes];
  }
}

module.exports = OneOfTypeElement;
