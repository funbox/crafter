const Refract = require('../../Refract');

/**
 * Корневой элемент дерева Element AST
 */
class BlueprintElement {
  /**
   * @param {StringElement} title - название документации
   * @param {DescriptionElement} description
   * @param {MetaDataElement[]} meta - массив мета-данных
   */
  constructor(title, description, meta) {
    this.title = title;
    this.description = description;
    /**
     * @typedef {(ResourceElement|ResourceGroupElement|DataStructureGroupElement|SchemaStructureGroupElement|ResourcePrototypesElement)} BlueprintElementContent
     * @type {BlueprintElementContent[]}
     */
    this.content = [];
    /**
     * @type {AnnotationElement[]}
     */
    this.annotations = [];
    this.meta = meta;
    this.isError = false;
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
            content: Refract.categoryClasses.api,
          }],
        },
        title: this.title.toRefract(sourceMapsEnabled),
      },
      content: this.content.map(item => item.toRefract(sourceMapsEnabled)),
    };

    if (this.description) {
      result.content.unshift(this.description.toRefract(sourceMapsEnabled));
    }

    if (this.meta.length) {
      result.attributes = {
        metadata: {
          element: Refract.elements.array,
          content: this.meta.map(metaElement => metaElement.toRefract(sourceMapsEnabled)),
        },
      };
    }

    let content = this.annotations.map(annotation => annotation.toRefract(sourceMapsEnabled));
    if (!this.isError) {
      content = [result].concat(content);
    }

    return {
      element: Refract.elements.parseResult,
      content,
    };
  }
}

module.exports = BlueprintElement;
