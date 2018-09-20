const utils = require('../../utils');

class ArrayElement {
  constructor(members) {
    this.members = members;
  }

  toRefract() {
    return this.members.map(element => element.toRefract());
  }
}

module.exports = ArrayElement;
