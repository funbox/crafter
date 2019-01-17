const Refract = require('../../Refract');

class SchemaElement {
  constructor(schema) {
    this.schema = schema;
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.asset,
      meta: {
        classes: [
          Refract.categoryClasses.messageBodySchema,
        ],
      },
      attributes: {
        contentType: {
          element: Refract.elements.string,
          content: 'application/schema+json',
        },
      },
      content: JSON.stringify(this.schema, null, 2),
    };

    if (this.sourceMap) {
      result.attributes.sourceMap = this.sourceMap.toRefract();
    }

    return result;
  }

  getBody() {
    return {};
  }
}

module.exports = SchemaElement;
