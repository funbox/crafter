const utils = require('../../utils');
const ArrayMemberElement = require('./ArrayMemberElement');

class ArrayElement {
  constructor(type) {
    const resolvedType = utils.resolveType(type);

    this.valueMembers = resolvedType.nestedTypes.map(t => new ArrayMemberElement(t));
  }

  toRefract() {
    return this.valueMembers.map(element => element.toRefract());
  }
}

module.exports = ArrayElement;
