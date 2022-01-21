const Refract = require('../../Refract');

/**
 * A body template that includes __oneOf-X__ fields with all possible variations of One Of option.
 *
 * Example:
 *
 * {
 *   "a": 1,
 *   "__oneOf-1__": [
 *     { "b": 2 },
 *     { "c": 3 },
 *   ]
 * }
 *
 * This template can be used to generate two variants of a body: { "a": 1, "b": 2 } and { "a": 1, "c": 3 }.
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
