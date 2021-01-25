const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Ресурс. Возможны несколько вариантов объявления ресурса:
 *
 * # /users <-- неименованный ресурс
 * # GET <-- Action
 * + Response 200
 *
 * # Пользователи [/users] <-- именованный ресурс
 * # GET <-- Action
 * + Response 200
 *
 * # GET /users <-- неименованный endpoint (ресурс + action в одном узле Markdown AST)
 * + Response 200
 *
 * # Пользователи [GET /users] <-- именованный endpoint (ресурс + action в одном узле Markdown AST)
 * + Response 200
 *
 * @see https://apielements.org/en/latest/element-definitions.html#resource
 */
class ResourceElement {
  /**
   * @param {StringElement} href - URL HTTP-запроса
   * @param {StringElement=} title - опциональный заголовок
   * @param {StringElement[]} prototypes - список Resource Prototypes для данного элемента
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

    if (this.prototypes.length) {
      result.attributes.prototypes = {
        element: Refract.elements.array,
        content: this.prototypes.map(p => p.toRefract(sourceMapsEnabled)),
      };
    }

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }
}

module.exports = ResourceElement;
