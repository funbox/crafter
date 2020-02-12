const Refract = require('../../Refract');
const Flags = require('../../Flags');

/**
 * Секция "One Of"
 *
 * Пример:
 *
 * исходный текст:
 *   + One Of
 *     + foo
 *     + bar
 *
 * дерево:
 * OneOfTypeElement <--
 *   options:
 *     - OneOfTypeOptionElement
 *     - OneOfTypeOptionElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#select-element
 */
class OneOfTypeElement {
  constructor() {
    /**
     * @type {OneOfTypeOptionElement[]}
     */
    this.options = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.select,
      content: this.options.map(option => option.toRefract(sourceMapsEnabled)),
    };
  }

  /**
   * @param {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    if (this.options.length) {
      return this.options[0].getBody(dataTypes);
    }

    return {};
  }

  /**
   * @param {Object.<string, (ValueMemberElement|SchemaNamedTypeElement)>} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(dataTypes, flags = new Flags()) {
    const usedTypes = [];
    const schema = {
      oneOf: this.options.map(option => {
        const [optionSchema, optionUsedTypes] = option.getSchema(dataTypes, flags);
        usedTypes.push(...optionUsedTypes);
        return optionSchema;
      }),
    };

    return [schema, usedTypes];
  }
}

module.exports = OneOfTypeElement;
