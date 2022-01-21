const Refract = require('../../Refract');
const RequestElement = require('./RequestElement');
const SourceMapElement = require('./SourceMapElement');
const { addPrototypesToRefract } = require('./ResourcePrototypesUtils');

/**
 * Action is a bundle of URL + HTTP method + at least one Request + at least one Response.
 * If a documentation file has no user-defined requests, a request will be created automatically in the method ActionParser.finalize.
 *
 * Multiple Action elements group into a Resource element within one URL, i.e. the following example has one ResourceElement with two Action elements.
 *
 * # Users [/users]
 *
 * ## Action with an optional title [GET]
 * + Response 200
 *
 * ## POST
 * + Response 200
 *
 * This example has a ResourceElement with only one ActionElement.
 *
 * # List users [GET /users/]
 * + Response 200
 *
 * Tree:
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
   * @param {StringElement} method - HTTP-method (GET, POST, etc)
   * @param {StringElement=} href - URL of HTTP request
   * @param {StringElement} title - optional title
   * @param {StringElement[]} prototypes - a list of Resource Prototypes of this element
   * @param {SourceMap} sourceMap
   * @param {boolean} languageServerMode
   */
  constructor(method, href, title, prototypes, sourceMap, languageServerMode) {
    this.method = method;
    this.href = href;
    this.title = title;
    this.prototypes = prototypes;

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
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    this.sourceMap = sourceMap;
    this.languageServerMode = languageServerMode;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.transition,
      content: [],
    };

    if (this.title) {
      result.meta = {
        title: this.title.toRefract(sourceMapsEnabled),
      };
    }

    if (this.href) {
      result.attributes = {
        href: this.href.toRefract(sourceMapsEnabled),
      };
    }

    if (this.parameters) {
      result.attributes = result.attributes || {};
      result.attributes.hrefVariables = this.parameters.toRefract(sourceMapsEnabled);
    }

    addPrototypesToRefract(this, result, sourceMapsEnabled);

    if (sourceMapsEnabled) {
      result.attributes = result.attributes || {};
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    let requests = this.requests;
    const responses = this.responses;

    if (requests.length === 0) {
      const request = new RequestElement();
      request.method = this.method;
      requests = requests.concat([request]);
    }

    requests.forEach((request) => {
      if (responses.length) {
        responses.forEach((response) => {
          result.content.push({
            element: Refract.elements.httpTransaction,
            content: [
              request.toRefract(sourceMapsEnabled),
              response.toRefract(sourceMapsEnabled),
            ],
            ...sourceMapsEnabled ? {
              attributes: {
                sourceMap: new SourceMapElement([
                  ...request.sourceMap ? request.sourceMap.byteBlocks : [],
                  ...response.sourceMap ? response.sourceMap.byteBlocks : [],
                ]).toRefract(),
              },
            } : {},
          });
        });
      } else if (this.languageServerMode) {
        result.content.push({
          element: Refract.elements.httpTransaction,
          content: [
            request.toRefract(sourceMapsEnabled),
          ],
          ...sourceMapsEnabled ? {
            attributes: {
              sourceMap: new SourceMapElement([
                ...request.sourceMap ? request.sourceMap.byteBlocks : [],
              ]).toRefract(),
            },
          } : {},
        });
      }
    });

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
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
}

module.exports = ActionElement;
