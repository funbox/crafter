class Flags {
  /**
   * @param {(Flags|Object)=} flags
   */
  constructor(flags = {}) {
    /**
     * @type {boolean}
     */
    this.isFixed = flags.isFixed || false;
    /**
     * @type {boolean}
     */
    this.isFixedType = flags.isFixedType || false;
    /**
     * @type {boolean}
     */
    this.isNullable = flags.isNullable || false;
    /**
     * @type {boolean}
     */
    this.skipTypesInlining = flags.skipTypesInlining || false;
  }
}

module.exports = Flags;
