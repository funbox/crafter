const { elements: { string } } = require('../../Refract');

class SampleValueElement {
  constructor(values = [], refractType = string) {
    this.values = values;
    this.refractType = refractType;
    this.content = null;
    this.valuesForBody = null;
  }

  toRefract() {
    return {
      element: this.refractType,
      content: this.content,
    };
  }

  getBody(resolvedTypes) {
    return this.valuesForBody.reduce((result, value) => {
      if (value !== undefined) {
        if (value.getBody) {
          result.push(value.getBody(resolvedTypes));
        } else {
          result.push(value);
        }
      }
      return result;
    }, []);
  }
}

module.exports = SampleValueElement;
