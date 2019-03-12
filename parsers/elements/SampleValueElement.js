class SampleValueElement {
  constructor(values = [], type = 'string') {
    this.values = values;
    this.type = type;
    this.content = null;
    this.valuesForBody = null;
  }

  toRefract() {
    const result = {
      element: this.type,
    };

    if (this.content != null) {
      result.content = this.content;
    }
    return result;
  }

  getBody(resolvedTypes) {
    const sourceField = this.valuesForBody || this.values;
    const body = sourceField.map(value => {
      if (value.getBody) {
        return value.getBody(resolvedTypes);
      }

      return value;
    });

    return body;
  }
}

module.exports = SampleValueElement;
