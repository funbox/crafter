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

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.httpResponse,
      content: this.content.map(c => c.toRefract(sourceMapsEnabled)),
      attributes: {
        statusCode: {
          element: Refract.elements.string,
          content: this.statusCode,
          ...(sourceMapsEnabled && this.sourceMap ? {
            attributes: { sourceMap: this.sourceMap.toRefract(sourceMapsEnabled) },
          } : {}),
        },
      },
    };

    this.headersSections.forEach((headers) => {
      if (result.attributes.headers) {
        result.attributes.headers.content = result.attributes.headers.content.concat(headers.toRefract(sourceMapsEnabled).content);
      } else {
        result.attributes.headers = headers.toRefract(sourceMapsEnabled);
      }
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (sourceMapsEnabled && this.sourceMap) {
      result.attributes.sourceMap = this.sourceMap.toRefract(sourceMapsEnabled);
    }

    return result;
  }

  getBody(resolvedTypes) {
    let body = {};
    if (this.contentType !== 'application/json') {
      return body;
    }
    this.content.forEach(item => {
      body = utils.mergeBodies(body, item.getBody(resolvedTypes));
    });
    return body.value !== undefined ? body.value : body;
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
