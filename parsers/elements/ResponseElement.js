const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');
const utils = require('../../utils');

/**
 * Элемент для описания HTTP-ответа.
 *
 * Пример:
 *
 * + Response 200 (application/json)
 *   + Body
 *             {
 *               "hello": "world"
 *             }
 *
 * Дерево:
 *
 * ResponseElement <--
 *   statusCode: 200
 *   contentType: application/json
 *   content:
 *     - BodyElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#http-response-message-http-message-payload
 */
class ResponseElement {
  /**
   * @param {number=} statusCode - код ответа HTTP
   * @param {string=} contentType - заголовок content-type, например application/json
   * @param {SourceMap} sourceMap
   */
  constructor(statusCode = 200, contentType, sourceMap) {
    this.statusCode = statusCode;
    this.contentType = contentType;
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
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

    const result = {
      element: Refract.elements.httpResponse,
      content: this.content.map(c => c.toRefract(sourceMapsEnabled)),
      attributes: {
        statusCode: {
          element: Refract.elements.number,
          content: this.statusCode,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      },
    };

    if (this.headersSections.length) {
      result.attributes.headers = utils.mergeHeadersSections(this.headersSections).toRefract(sourceMapsEnabled);
    }

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (sourceMapEl) {
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    if (this.contentType !== 'application/json') {
      return undefined;
    }

    const attrsEl = this.content.find(item => item instanceof AttributesElement);
    return attrsEl && attrsEl.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
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

module.exports = ResponseElement;
