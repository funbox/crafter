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
   * @param {Set} resolvedTypes - типы из TypeResolver
   */
  getBody(resolvedTypes) {
    if (this.options.length) {
      return this.options[0].getBody(resolvedTypes);
    }

    return {};
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(resolvedTypes, flags = new Flags()) {
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
