const Refract = require('../../Refract');

const ValueMemberElement = require('./ValueMemberElement');
const SourceMapElement = require('./SourceMapElement');

/**
 * Именованный тип данных
 *
 * # Data Structures
 * ## User <-- именованный тип данных
 * + name (string, required)
 * + email (string, required)
 *
 * @see https://apielements.org/en/latest/element-definitions.html#data-structure
 */
class MSONNamedTypeElement {
  /**
   *
   * @param {StringElement} name
   * @param {string} baseType - название родительского типа (примитивный или именованный тип)
   * @param {(string|Array)[]} typeAttributes - набор атрибутов типа fixed, required, ["minimum", 10]
   */
  constructor(name, baseType, typeAttributes) {
    this.name = name;
    /**
     * В самом именованном типе хранится только название и описание.
     * Все внутренности типа лежат в этом поле.
     * @type {ValueMemberElement}
     */
    this.content = new ValueMemberElement(baseType, typeAttributes);
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.dataStructure,
      content: Object.assign(this.content.toRefract(sourceMapsEnabled), {
        meta: {
          id: this.name.toRefract(sourceMapsEnabled),
        },
      }),
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
      result.content.meta.description = description;
    }

    return result;
  }
}

module.exports = MSONNamedTypeElement;
