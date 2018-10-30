const Refract = require('../../Refract');

class SchemaElement {
  constructor(schema) {
    this.schema = schema;
  }

  toRefract() {
    return {
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
  }
}

module.exports = SchemaElement;
