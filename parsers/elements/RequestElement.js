const Refract = require('../../Refract');
const utils = require('../../utils');
const SourceMapElement = require('./SourceMapElement');

class RequestElement {
  constructor(contentType, title) {
    this.contentType = contentType;
    this.title = title;
    this.method = null;
    this.description = null;
    this.headersSections = [];
    this.content = [];
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.httpRequest,
      attributes: {
        method: this.method.toRefract(sourceMapsEnabled),
      },
      content: this.content.map(c => c.toRefract(sourceMapsEnabled)),
    };

    if (this.title) {
      result.meta = {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      };
    }

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

    if (sourceMapEl) {
      result.attributes.sourceMap = sourceMapEl.toRefract();
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
    return body;
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

module.exports = RequestElement;
