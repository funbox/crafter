const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');

/**
 * Элемент типа Message, нужен для описания не-HTTP взаимодействий
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

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   */
  getSchema(resolvedTypes) {
    let schema;

    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    if (attrsEl) {
      const [attrsElSchema] = attrsEl.getSchema(resolvedTypes);
      schema = attrsElSchema;
    }

    return [schema];
  }
}

module.exports = MessageElement;
