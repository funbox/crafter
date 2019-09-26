const Refract = require('../../Refract');

const SourceMapElement = require('./SourceMapElement');

class SchemaNamedTypeElement {
  constructor(name) {
    this.name = name;
    this.bodyEl = null;
    this.schemaEl = null;
    this.body = null;
  }

  isComplex() {
    return true;
  }

  getBody() {
    return this.body;
  }

  getSchema() {
    const usedTypes = [];
    return [this.schemaEl.schema, usedTypes];
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.schemaStructure,
      meta: {
        id: this.name.toRefract(sourceMapsEnabled),
      },
      content: [this.bodyEl.toRefract(sourceMapsEnabled), this.schemaEl.toRefract(sourceMapsEnabled)],
    };

    if (this.description) {
      const description = {
        element: Refract.elements.string,
        content: this.description.description,
      };
      if (sourceMapsEnabled && this.description.sourceMap) {
        description.attributes = {
          sourceMap: new SourceMapElement(this.description.sourceMap.byteBlocks, this.description.sourceMap.file).toRefract(),
        };
      }
      result.meta.description = description;
    }

    return result;
  }
}

module.exports = SchemaNamedTypeElement;
