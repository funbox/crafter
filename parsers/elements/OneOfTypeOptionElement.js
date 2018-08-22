const Refract = require('../../Refract');

class OneOfTypeOptionElement {
  constructor(members = []) {
    this.members = members;
  }

  toRefract() {
    return {
      element: Refract.elements.option,
      content: this.members.map(member => member.toRefract()),
    };
  }
}

module.exports = OneOfTypeOptionElement;
