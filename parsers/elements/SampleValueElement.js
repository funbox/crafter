const Refract = require('../../Refract');

class SampleValueElement {
  constructor(values = []) {
    this.members = values;
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
