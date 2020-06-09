const Refract = require('../../Refract');

/**
 * Элемент для подгрупп при описании не-HTTP-взаимодействия.
 *
 * Пример:
 *
 * # SubGroup chat:1234 <--
 *   Block description of the channel with id "1234"
 *
 *   ## Message ClientToServerMessage
 *     + Attributes
 *       + text: `Hello there` (string, required) - message text
 */
class SubgroupElement {
  /**
   * @param {StringElement} title
   */
  constructor(title) {
    this.title = title;
    this.description = null;
    /**
     * @type {MessageElement[]}
     */
    this.messages = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.subGroup,
          }],
        },
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: this.messages.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = SubgroupElement;
