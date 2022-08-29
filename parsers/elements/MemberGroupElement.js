/**
 * Element to store groups of objects, arrays, enums
 *
 * Samples:
 *
 * + Attributes
 *   block description
 *   + Properties <-- MemberGroupElement
 *     + id (string)
 *     + name: `John` (string)
 *
 * + Attributes(array)
 *   block description
 *   + Items <-- MemberGroupElement
 *     + id (string)
 *     + name (string)
 *
 * + kind (enum)
 *   block description
 *   + Members <-- MemberGroupElement
 *     + movement
 *     + track
 */
class MemberGroupElement {
  /**
   * @param {string} type - type of a group (array, enum, object)
   */
  constructor(type) {
    this.type = type;
    /**
     * @type {ValueMemberElement}
     */
    this.childValueMember = null;
  }
}

module.exports = MemberGroupElement;
