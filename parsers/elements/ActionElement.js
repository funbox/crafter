const Refract = require('../../Refract');
const RequestElement = require('./RequestElement');
const SourceMapElement = require('./SourceMapElement');

/**
 * Action - связка URL + метод + 1 и более Request + 1 или более Response
 * если запросов в тексте документации нет - то один запрос будет создан автоматически в методе ActionParser.finalize
 *
 * Action элементы группируются в элемент Resource в рамках одного URL, т.е. для примера ниже будет ResourceElement в котором два ActionElement
 *
 * # Users [/users]
 *
 * ## Action с опциональным заголовком [GET]
 * + Response 200
 *
 * ## POST
 * + Response 200
 *
 * А для такого примера будет ResourceElement в котором только один ActionElement
 *
 * # List users [GET /users/]
 * + Response 200
 *
 * Дерево:
 *
 * ResourceElement
 *   actions:
 *     - ActionElement <--
 *       requests:
 *         - RequestElement
 *       responses:
 *         - ResponseElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#transition
 */
class ActionElement {
  /**
   * @param {string} title - опциональный заголовок
   * @param {string} href - url HTTP-запроса
   * @param {StringElement} method - HTTP метод (GET, POST и т.п.)
   */
  constructor(title, href, method) {
    this.title = title;
    this.href = href;
    this.method = method;
    /**
     * @type {RequestElement[]}
     */
    this.requests = [];
    /**
     * @type {ResponseElement[]}
     */
    this.responses = [];
    /**
     * @type {ParametersElement}
     */
    this.parameters = null;
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.transition,
      meta: {
        title: {
          element: Refract.elements.string,
          content: this.title,
          ...(sourceMapEl && this.title ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      },
      content: [],
    };

    if (this.href) {
      result.attributes = {
        href: {
          element: Refract.elements.string,
          content: this.href,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
      };
    }

    if (this.parameters) {
      result.attributes = result.attributes || {};
      result.attributes.hrefVariables = this.parameters.toRefract(sourceMapsEnabled);
    }

    let requests = this.requests;
    const responses = this.responses;

    if (requests.length === 0) {
      const request = new RequestElement();
      request.method = this.method;
      requests = requests.concat([request]);
    }

    requests.forEach((request) => {
      responses.forEach((response) => {
        result.content.push({
          element: Refract.elements.httpTransaction,
          content: [
            request.toRefract(sourceMapsEnabled),
            response.toRefract(sourceMapsEnabled),
          ],
        });
      });
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = ActionElement;
