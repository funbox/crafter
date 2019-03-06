class DefaultValueElement {
  constructor(values, type = 'string') {
    this.values = values;
    this.type = type;
    this.sourceMap = null;
    this.content = null;
  }

  toRefract() {
    const result = {
      element: this.type,
    };

    if (this.content != null) {
      result.content = this.content;
    }

    if (this.sourceMap) {
      if (typeof this.content === 'object') {
        result.content.attributes = {
          sourceMap: this.sourceMap.toRefract(),
        };
      } else {
        result.attributes = {
          sourceMap: this.sourceMap.toRefract(),
        };
      }
    }

    return result;
  }
}

module.exports = DefaultValueElement;
