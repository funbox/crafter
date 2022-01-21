const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');

/**
 * Element of Message type that is used to describe non-HTTP interactions
 *
 * Example:
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
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
    /**
     * @type {(BodyElement|SchemaElement|AttributesElement)[]}
     */
    this.content = [];
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
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

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   */
  getBody(dataTypes) {
    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    return attrsEl && attrsEl.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
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
