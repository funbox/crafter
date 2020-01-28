const Refract = require('../../Refract');

/**
 * Группа ресурсов
 *
 * # Group Users <-- начало группы ресурсов
 *
 * # GET /user
 * + Response 200
 *
 * @see https://apielements.org/en/latest/element-definitions.html#category
 */
class ResourceGroupElement {
  /**
   * @param {StringElement} title - название группы ресурсов
   */
  constructor(title) {
    this.title = title;
    this.description = null;
    this.resources = [];
    this.subgroups = [];
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const content = this.resources.length > this.subgroups.length ? this.resources : this.subgroups;
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: {
          element: Refract.elements.array,
          content: [{
            element: Refract.elements.string,
            content: Refract.categoryClasses.resourceGroup,
          }],
        },
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: content.map(r => r.toRefract(sourceMapsEnabled)),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    return result;
  }
}

module.exports = ResourceGroupElement;
