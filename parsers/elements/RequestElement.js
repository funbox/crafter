const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');
const utils = require('../../utils');

/**
 * HTTP request element
 *
 * Example:
 *
 * + Request MyRequest (application/json)
 *   + Body
 *             {
 *               "hello": "world"
 *             }
 *
 * resulting tree:
 *
 * RequestElement <--
 *   title: MyRequest
 *   content:
 *     - BodyElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#http-request-message-http-message-payload
 */
class RequestElement {
  /**
   * @param {string=} contentType - a "content-type" header, e.g. application/json
   * @param {StringElement} title - an optional title of a request
   * @param {SourceMap} sourceMap
   */
  constructor(contentType, title, sourceMap) {
    this.contentType = contentType;
    this.title = title;
    /**
     * request method (GET, POST, etc) set in ActionParser
     * @type {StringElement}
     */
    this.method = null;
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
    /**
     * @type {HeadersElement[]}
     */
    this.headersSections = [];
    /**
     * @type {(SchemaElement|AttributesElement|BodyElement)[]}
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
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

    const result = {
      element: Refract.elements.httpRequest,
      attributes: {
        method: this.method.toRefract(sourceMapsEnabled),
      },
      content: this.content.map(c => c.toRefract(sourceMapsEnabled)),
    };

    if (this.title) {
      result.meta = {
        title: this.title.toRefract(sourceMapsEnabled),
      };
    }

    if (this.headersSections.length) {
      result.attributes.headers = utils.mergeHeadersSections(this.headersSections).toRefract(sourceMapsEnabled);
    }

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (sourceMapEl) {
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    if (this.unrecognizedBlocks.length) {
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
    if (this.contentType !== 'application/json') {
      return undefined;
    }

    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    return attrsEl && attrsEl.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   */
  getSchema(dataTypes) {
    let schema;

    if (this.contentType !== 'application/json') {
      return [schema];
    }
    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    if (attrsEl) {
      [schema] = attrsEl.getSchema(dataTypes);
    }

    return [schema];
  }
}

module.exports = RequestElement;
