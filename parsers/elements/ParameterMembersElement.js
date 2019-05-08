const Refract = require('../../Refract');

class ParameterMembersElement {
  constructor() {
    this.members = [];
  }

  toRefract(sourceMapsEnabled) {
    return {
      element: Refract.elements.array,
      content: this.members.map(m => m.toRefract(sourceMapsEnabled)),
    };
  }
}

module.exports = ParameterMembersElement;
