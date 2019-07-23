const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class SchemaElement {
  constructor(schema) {
    this.schema = schema;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

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

    if (sourceMapEl) {
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = SchemaElement;
