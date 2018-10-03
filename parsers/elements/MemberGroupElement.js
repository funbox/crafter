class MemberGroupElement {
  constructor(type) {
    this.type = type;
    this.members = [];
  }

  toRefract() {
    return this.members;
  }
}

module.exports = MemberGroupElement;
