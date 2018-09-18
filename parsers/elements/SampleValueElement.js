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

function convertType(literal, type) {
  switch (type) {
    case 'boolean':
      if (literal === 'true' || literal === 'false') {
        return { valid: true, value: literal === 'true' };
      }
      break;
    case 'number':
      if (!isNaN(literal)) {
        return { valid: true, value: parseFloat(literal) };
      }
      break;
    case 'string':
      if (literal !== '') {
        return { valid: true, value: literal };
      }
      break;
    default:
      return { valid: false };
  }
  return { valid: false };
}

module.exports = SampleValueElement;
