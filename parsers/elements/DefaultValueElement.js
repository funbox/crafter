class DefaultValueElement {
  constructor(values, type = 'string') {
    this.values = values;
    this.type = type;
    this.sourceMap = null;
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

  getSchema(resolvedTypes) {
    const sourceField = this.valuesForBody || this.values;
    const schema = sourceField.map(value => {
      if (value.getBody) {
        return value.getBody(resolvedTypes);
      }
      return value;
    });
    return schema;
  }
}

module.exports = DefaultValueElement;
