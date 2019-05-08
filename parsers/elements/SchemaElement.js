const Refract = require('../../Refract');

class SchemaElement {
  constructor(schema) {
    this.schema = schema;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
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

    if (sourceMapsEnabled && this.sourceMap) {
      result.attributes.sourceMap = this.sourceMap.toRefract(sourceMapsEnabled);
    }

    return result;
  }

  getBody() {
    return {};
  }
}

module.exports = SchemaElement;
