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
