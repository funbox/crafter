const utils = require('../../utils');

class ArrayElement {
  constructor(valueMembers) {
    this.valueMembers = valueMembers;
  }

  toRefract() {
    return this.valueMembers.map(element => element.toRefract());
  }
}

module.exports = ArrayElement;
