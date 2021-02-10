const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

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
   * @param {SourceMap} sourceMap
   */
  constructor(title, sourceMap) {
    this.title = title;
    this.description = null;
    /**
     * @type {MessageElement[]}
     */
    this.messages = [];
    this.sourceMap = sourceMap;
    // Тут не может быть unrecognizedBlocks, потому что такой блок либо уйдет в description
    // либо распознается как unrecognizedBlocks одной из вложенных секций
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

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = { sourceMap: sourceMapEl.toRefract() };
    }

    return result;
  }
}

module.exports = SubgroupElement;
