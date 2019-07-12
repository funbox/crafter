class SampleValueElement {
  constructor(values = [], type = 'string') {
    this.values = values;
    this.type = type;
    this.content = null;
    this.valuesForBody = null;
  }

  toRefract() {
    return {
      element: this.type,
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
