const Refract = require('../../Refract');

class ParameterMembersElement {
  constructor() {
    this.members = [];
  }

  toRefract() {
    return {
      element: Refract.elements.array,
      content: this.members.map(m => ({
        element: Refract.elements.string,
        content: m,
      })),
    };
  }
}

module.exports = ParameterMembersElement;