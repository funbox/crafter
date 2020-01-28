const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');

/**
 * Элемент секции "One Of"
 *
 * Пример:
 *
 * исходный текст:
 *   + One Of
 *     + foo
 *     + bar
 *
 * дерево:
 * OneOfTypeElement
 *   options:
 *     - OneOfTypeOptionElement <--
 *       members:
 *         - PropertyMemberElement
 *     - OneOfTypeOptionElement <--
 *       members:
 *         - PropertyMemberElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#option-element
 */
class OneOfTypeOptionElement {
  /**
   * @param {PropertyMemberElement[]} members
   */
  constructor(members = []) {
    this.members = members;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.option,
      content: this.members.map(member => member.toRefract(sourceMapsEnabled)),
    };
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   */
  getBody(resolvedTypes) {
    return this.members.reduce((body, member) => ({
      ...body,
      ...member.getBody(resolvedTypes),
    }), {});
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(resolvedTypes, flags = new Flags()) {
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
