const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const { addPrototypesToRefract } = require('./ResourcePrototypesUtils');

/**
 * Resource element. There are multiple options
 *
 * # /users <-- unnamed resource
 * # GET <-- Action
 * + Response 200
 *
 * # Users [/users] <-- named resource
 * # GET <-- Action
 * + Response 200
 *
 * # GET /users <-- unnamed endpoint (resource + action in the single Markdown AST node)
 * + Response 200
 *
 * # Users [GET /users] <-- named endpoint (resource + action in the single Markdown AST node)
 * + Response 200
 *
 * @see https://apielements.org/en/latest/element-definitions.html#resource
 */
class ResourceElement {
  /**
   * @param {StringElement} href - URL of a HTTP request
   * @param {StringElement=} title - an optional title
   * @param {StringElement[]} prototypes - a list of Resource Prototypes for current element
   * @param {SourceMap} sourceMap
   */
  constructor(href, title, prototypes, sourceMap) {
    this.href = href;
    this.title = title;
    this.prototypes = prototypes;
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
    /**
     * @type {ParametersElement}
     */
    this.parameters = null;
    /**
     * @type {ActionElement[]}
     */
    this.actions = [];

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
      element: Refract.elements.resource,
      attributes: {
        href: this.href.toRefract(sourceMapsEnabled),
      },
      content: this.actions.map(a => a.toRefract(sourceMapsEnabled)),
    };

    if (this.title) {
      result.meta = {
        title: this.title.toRefract(sourceMapsEnabled),
      };
    }

    if (this.parameters) {
      result.attributes.hrefVariables = this.parameters.toRefract(sourceMapsEnabled);
    }

    addPrototypesToRefract(this, result, sourceMapsEnabled);

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
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
}

module.exports = ResourceElement;
