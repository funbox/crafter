class SampleValueElement {
  constructor(values = [], type = 'string') {
    this.members = values;
    this.type = type;
    this.content = null;
  }

  toRefract() {
    const result = {
      element: this.type,
    };

    if (this.content) {
      result.content = this.content;
    }
    return result;
  }

  getBody() {
    const body = this.members.map(member => {
      if (member.getBody) {
        return member.getBody();
      }

      return member;
    });

    return body;
  }
}

module.exports = SampleValueElement;
