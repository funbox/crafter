const Refract = require('../../Refract');

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
   */
  constructor(href, title) {
    this.href = href;
    this.title = title;
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

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = ResourceElement;
