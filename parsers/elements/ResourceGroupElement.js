const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');
const { addPrototypesToRefract } = require('./ResourcePrototypesUtils');

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
   * @param {StringElement[]} prototypes - список Resource Prototypes для данного элемента
   * @param {SourceMap} sourceMap
   */
  constructor(title, prototypes, sourceMap) {
    this.title = title;
    this.prototypes = prototypes;
    /**
     * @type {DescriptionElement}
     */
    this.description = null;
    /**
     * @type {ResourceElement[]}
     */
    this.resources = [];
    /**
     * @type {SubgroupElement[]}
     */
    this.subgroups = [];
    this.sourceMap = sourceMap;
    // Тут не может быть unrecognizedBlocks, потому что такой блок либо уйдет в description
    // либо распознается как unrecognizedBlocks одной из вложенных секций
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

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = { sourceMap: sourceMapEl.toRefract() };
    }

    addPrototypesToRefract(this, result, sourceMapsEnabled);

    return result;
  }
}

module.exports = ResourceGroupElement;
