const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент перечисления для параметра URL типа enum
 *
 * Пример:
 *
 * + Parameters
 *   + quality (enum)
 *     + Members
 *       + normal
 *       + premium
 *
 * Дерево:
 *
 * ParameterElement
 *   enumerations: ParameterMembersElement
 *     members:
 *       - ParameterEnumMemberElement <--
 *       - ParameterEnumMemberElement <--
 */
class ParameterEnumMemberElement {
  /**
   * @param {string} value
   * @param {string} description
   */
  constructor(value, description) {
    this.value = value;
    this.description = description;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.string,
      content: this.value,
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
