const utils = require('../../utils');

class ArrayElement {
  constructor(ValueMemberElement, type) {
    const resolvedType = utils.resolveType(type);
    this.valueMembers = resolvedType.nestedTypes.map(t => new ValueMemberElement(t));
  }

  toRefract() {
    return this.valueMembers.map(element => element.toRefract());
  }
}

module.exports = ArrayElement;
