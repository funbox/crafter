const Refract = require('../../Refract');

/**
 * Enumerations of URL parameter declared as enum
 *
 * Example:
 *
 * + Parameters
 *   + quality (enum)
 *     + Members
 *       + normal
 *       + premium
 *
 * resulting tree:
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
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
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
