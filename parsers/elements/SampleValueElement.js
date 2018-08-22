const Refract = require('../../Refract');

class SampleValueElement {
  constructor(value) {
    this.members = value ? [value] : [];
  }

  toRefract() {
    return this.members.map((value) => {
      if (value.toRefract) {
        return value.toRefract();
      }

      return ({
        element: Refract.elements.string,
        content: value,
      });
    });
  }
}

module.exports = SampleValueElement;
