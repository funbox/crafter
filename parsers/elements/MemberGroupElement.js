/**
 * Элемент для хранения групп элементов объектов, массивов и enum-ов.
 *
 * Примеры:
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
   * @param {string} type - тип группы (array, enum, object)
   */
  constructor(type) {
    this.type = type;
    /**
     * @type {(ValueMemberElement|EnumMemberElement|PropertyMemberElement)[]}
     */
    this.members = [];
  }

  toRefract() {
    return this.members;
  }
}

module.exports = MemberGroupElement;
