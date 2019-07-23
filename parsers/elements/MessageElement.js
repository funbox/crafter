const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');

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
    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    return attrsEl && attrsEl.getBody(resolvedTypes);
  }

  getSchema(resolvedTypes) {
    let schema;

    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    if (attrsEl) {
      schema = attrsEl.getSchema(resolvedTypes);
    }

    // TODO Перенести это в AttributesElement
    if (schema) {
      return {
        $schema: 'http://json-schema.org/draft-04/schema#',
        ...schema,
      };
    }
    return schema;
  }
}

module.exports = MessageElement;
