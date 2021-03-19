const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Корневой элемент дерева Element AST
 */
class BlueprintElement {
  /**
   * @param {StringElement} title - название документации
   * @param {DescriptionElement} description
   * @param {MetaDataElement[]} meta - массив метаданных
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
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    /**
     * @type {SourceMap}
     */
    this.sourceMap = null;
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
        title: this.title && this.title.toRefract(sourceMapsEnabled),
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

    if (sourceMapsEnabled && this.sourceMap) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = result.attributes || {};
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    return {
      element: Refract.elements.parseResult,
      content,
    };
  }
}

module.exports = BlueprintElement;
