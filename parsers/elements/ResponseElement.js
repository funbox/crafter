const Refract = require('../../Refract');
const utils = require('../../utils');

class ResponseElement {
  constructor(statusCode = 200, contentType) {
    this.statusCode = statusCode;
    this.contentType = contentType;
    this.description = null;
    this.headersSections = [];
    this.content = [];
    this.sourceMap = null;
  }

  toRefract() {
    const result = {
      element: Refract.elements.httpResponse,
      content: this.content.map(c => c.toRefract()),
      attributes: {
        statusCode: {
          element: Refract.elements.string,
          content: this.statusCode,
          ...(this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract() },
          } : {}),
        },
      },
    };

    this.headersSections.forEach((headers) => {
      if (result.attributes.headers) {
        result.attributes.headers.content = result.attributes.headers.content.concat(headers.toRefract().content);
      } else {
        result.attributes.headers = headers.toRefract();
      }
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract());
    }

    if (this.sourceMap) {
      result.attributes.sourceMap = this.sourceMap.toRefract();
    }

    return result;
  }

  getSchema(resolvedTypes) {
    let schema = {};
    if (this.contentType !== 'application/json') {
      return schema;
    }
    this.content.forEach(item => {
      schema = utils.mergeSchemas(schema, item.getSchema(resolvedTypes));
    });
    if (Object.keys(schema).length > 0) {
      return {
        $schema: 'http://json-schema.org/draft-04/schema#',
        ...schema,
      };
    }
    return schema;
  }
}

module.exports = ResponseElement;
