class SampleValueElement {
  constructor(values = [], type = 'string') {
    this.members = values;
    this.type = type;
  }

  toRefract() {
    return this.members.map((value) => {
      if (value.toRefract) {
        return value.toRefract();
      }

      const content = convertType(value, this.type);
      const result = { element: this.type };

      if (content.valid) {
        result.content = content.value;
      }
      return result;
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
      if (!Number.isNaN(Number(literal))) {
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
