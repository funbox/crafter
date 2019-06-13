const Refract = require('../../Refract');
const utils = require('../../utils');
const SourceMapElement = require('./SourceMapElement');

class MessageElement {
  constructor(title, sourceMap) {
    this.title = title;
    this.sourceMap = sourceMap;
    this.description = null;
    this.content = [];
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.message,
      content: this.content.map(c => c.toRefract(sourceMapsEnabled)),
    };

    if (this.title) {
      result.meta = {
        title: this.title.toRefract(sourceMapsEnabled),
      };
    }

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (sourceMapEl) {
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }
    return result;
  }

  getBody(resolvedTypes) {
    let body = {};
    this.content.forEach(item => {
      body = utils.mergeBodies(body, item.getBody(resolvedTypes));
    });
    return body.value !== undefined ? body.value : body;
  }

  getSchema(resolvedTypes) {
    let schema = {};
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

module.exports = MessageElement;
