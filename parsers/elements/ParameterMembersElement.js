const Refract = require('../../Refract');

/**
 * Перечисления для параметра URL типа enum
 *
 * Пример:
 *
 * + Parameters
 *   + quality (enum)
 *     + Members
 *       + normal
 *       + premium
 *
 * Дерево:
 *
 * ParameterElement
 *   enumerations: ParameterMembersElement <--
 *     members:
 *       - ParameterEnumMemberElement
 *       - ParameterEnumMemberElement
 */
class ParameterMembersElement {
  constructor() {
    /**
     * @type {ParameterEnumMemberElement[]}
     */
    this.members = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.array,
      content: this.members.map(m => m.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = ParameterMembersElement;
