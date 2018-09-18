const Refract = require('../../Refract');

class ParameterMembersElement {
  constructor() {
    this.members = [];
  }

  toRefract() {
    return {
      element: Refract.elements.array,
      content: this.members.map(m => m.toRefract()),
    };
  }
}

module.exports = ParameterMembersElement;
