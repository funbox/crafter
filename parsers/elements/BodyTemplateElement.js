const Refract = require('../../Refract');

/**
 * Шаблон body, включающий поля вида __oneOf-X__ со всеми возможными опциями One Of.
 *
 * Пример:
 *
 * {
 *   "a": 1,
 *   "__oneOf-1__": [
 *     { "b": 2 },
 *     { "c": 3 },
 *   ]
 * }
 *
 * Из такого шаблона можно сгенерировать два body: { "a": 1, "b": 2 } и { "a": 1, "c": 3 }.
 */
class BodyTemplateElement {
  /**
   * @param {string} bodyTemplate
   */
  constructor(bodyTemplate) {
    this.bodyTemplate = bodyTemplate;
  }

  toRefract() {
    return {
      element: Refract.elements.asset,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.messageBodyTemplate,
          }],
        },
      },
      content: this.bodyTemplate,
    };
  }
}

module.exports = BodyTemplateElement;
