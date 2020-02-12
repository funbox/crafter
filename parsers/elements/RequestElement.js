const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const AttributesElement = require('./AttributesElement');

/**
 * Элемент для описания HTTP запроса
 *
 * Пример:
 *
 * + Request MyRequest (application/json)
 *   + Body
 *             {
 *               "hello": "world"
 *             }
 *
 * Дерево:
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
   * @param {string} contentType - заголовок content-type, например application/json
   * @param {string=} title - опциональный заголовок запроса
   */
  constructor(contentType, title) {
    this.contentType = contentType;
    this.title = title;
    /**
     * метод запроса (GET, POST и т.п.) задается в ActionParser
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
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.httpRequest,
      attributes: {
        method: this.method.toRefract(sourceMapsEnabled),
      },
      content: this.content.map(c => c.toRefract(sourceMapsEnabled)),
    };

    if (this.title) {
      result.meta = {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      };
    }

    this.headersSections.forEach((headers) => {
      if (result.attributes.headers) {
        result.attributes.headers.content = result.attributes.headers.content.concat(headers.toRefract(sourceMapsEnabled).content);
      } else {
        result.attributes.headers = headers.toRefract(sourceMapsEnabled);
      }
    });

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

module.exports = RequestElement;
