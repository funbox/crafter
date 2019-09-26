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
    const [result, usedTypes] = this.content.getSchema(resolvedTypes, utils.mergeFlags(flags, this.content));

    const definitions = {};

    if (usedTypes.length > 0) {
      const types = usedTypes.filter((value, index) => usedTypes.indexOf(value) === index);

      while (types.length > 0) {
        const type = types.shift();
        const typeEl = resolvedTypes[type];
        const [typeSchema, typeUsedTypes] = typeEl.getSchema(resolvedTypes, { skipTypesInlining: true });
        definitions[type] = typeSchema;

        typeUsedTypes.forEach(t => {
          if (!types.includes(t) && !definitions[t]) {
            types.push(t);
          }
        });
      }
    }

    if (result) {
      return [
        {
          $schema: 'http://json-schema.org/draft-04/schema#',
          ...(Object.keys(definitions).length > 0 ? { definitions } : {}),
          ...result,
        },
      ];
    }

    return [result];
  }
}

module.exports = AttributesElement;
