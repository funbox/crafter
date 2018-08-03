class ObjectElement {
  constructor() {
    this.propertyMembers = [];
  }

  toRefract() {
    return this.propertyMembers.map(element => element.toRefract());
  }
}

module.exports = ObjectElement;
