const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class ParameterEnumMemberElement {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.string,
      content: this.name,
    };

    if (sourceMapEl) {
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    if (this.description) {
      result.meta = {
        description: {
          element: Refract.elements.string,
          content: this.description,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      };
    }

    return result;
  }
}

module.exports = ParameterEnumMemberElement;
