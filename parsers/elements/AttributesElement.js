const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');

/**
 * Секция Attributes
 *
 * Пример:
 *
 * + Attributes (string)
 *
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     type: string
 *
 * @see https://apielements.org/en/latest/element-definitions.html#data-structure
 */
class AttributesElement {
  /**
   * @param {ValueMemberElement} content
   */
  constructor(content) {
    this.content = content;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.dataStructure,
      content: this.content.toRefract(sourceMapsEnabled),
    };
  }

  /**
   * @param {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    return this.content.getBody(dataTypes);
  }

  /**
   * @param {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} dataTypes - типы из TypeResolver
   * @param {Flags} flags - всегда пустой объект, добавлен для единообразия
   */
  getSchema(dataTypes, flags = new Flags()) {
    const [result, usedTypes] = this.content.getSchema(dataTypes, utils.mergeFlags(flags, this.content));

    const definitions = {};

    if (usedTypes.length > 0) {
      const types = usedTypes.filter((value, index) => usedTypes.indexOf(value) === index);

      while (types.length > 0) {
        const type = types.shift();
        const typeEl = dataTypes[type];
        const [typeSchema, typeUsedTypes] = typeEl.getSchema(dataTypes, { skipTypesInlining: true });
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
