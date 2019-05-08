const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

class EnumMemberElement {
  constructor(name, description, type, isSample) {
    this.name = name;
    this.sample = isSample ? name : null;
    this.description = description;
    this.type = type;
    this.sourceMap = null;
  }

  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements[this.type || 'string'],
      attributes: {
        ...(this.sample ? {} : {
          typeAttributes: {
            element: Refract.elements.array,
            content: [{
              element: Refract.elements.string,
              content: 'fixed',
            }],
          },
        }),
        ...(sourceMapEl ? { sourceMap: sourceMapEl.toRefract() } : {}),
      },
    };

    if (this.sample) {
      result.attributes.samples = {
        element: Refract.elements.array,
        content: [{
          element: this.type,
          content: this.sample,
        }],
      };
    } else {
      result.content = this.name;
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

module.exports = EnumMemberElement;
