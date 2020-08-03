const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент перечисления
 *
 * Пример:
 *
 * исходный текст:
 * + kind (enum)
 *   + track
 *   + movement
 *   + Sample track
 *
 * дерево:
 * PropertyMemberElement
 *   value: ValueMemberElement
 *     content: EnumElement
 *       members:
 *         - EnumMemberElement <--
 *           value: track
 *         - EnumMemberElement <--
 *           value: movement
 *       sampleValues:
 *         - EnumMemberElement <--
 *           value: track
 */
class EnumMemberElement {
  /**
   *
   * @param {string} value - значение элемента перечисления
   * @param {string} description
   * @param {string} type
   */
  constructor(value, description, type) {
    this.value = value;
    this.description = description;
    this.type = type;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

    const result = {
      element: Refract.elements[this.type || 'string'],
      attributes: {
        typeAttributes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: 'fixed',
          }],
        },
        ...(sourceMapEl ? { sourceMap: sourceMapEl.toRefract() } : {}),
      },
    };

    result.content = this.value;

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

  getBody() {
    return this.value;
  }

  getSchema() {
    return [this.value];
  }
}

module.exports = EnumMemberElement;
