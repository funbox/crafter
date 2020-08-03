const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');

/**
 * Элемент типа Message, нужен для описания не-HTTP-взаимодействий.
 *
 * Пример:
 *
 * ## Message ClientToServerMessage <--
 *   + Attributes
 *     + text: `Hello there` (string, required) - message text
 */
class MessageElement {
  /**
   * @param {StringElement} title
   * @param sourceMap
   */
  constructor(title, sourceMap) {
    this.title = title;
    this.sourceMap = sourceMap;
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
    /**
     * @type {(BodyElement|SchemaElement|AttributesElement)[]}
     */
    this.content = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

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

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    return attrsEl && attrsEl.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getSchema(dataTypes) {
    let schema;

    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    if (attrsEl) {
      const [attrsElSchema] = attrsEl.getSchema(dataTypes);
      schema = attrsElSchema;
    }

    return [schema];
  }
}

module.exports = MessageElement;
