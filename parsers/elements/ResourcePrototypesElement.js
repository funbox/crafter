const Refract = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Resource Prototypes element.
 *
 * Example:
 *
 * # Resource Prototypes <--
 * ## UserResource
 *   + Response 200 (application/json)
 *   + Attributes (UnauthorizedError, required)
 */
class ResourcePrototypesElement {
  /**
   * @param {SourceMap} sourceMap
   */
  constructor(sourceMap) {
    /**
     * @type {ResourcePrototypeElement[]}
     */
    this.resourcePrototypes = [];
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    this.sourceMap = sourceMap;
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
            content: Refract.categoryClasses.resourcePrototypes,
          }],
        },
      },
      content: this.resourcePrototypes.map(rp => rp.toRefract(sourceMapsEnabled)),
    };

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    if (this.unrecognizedBlocks.length) {
      result.attributes = result.attributes || {};
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
    }

    return result;
  }
}

module.exports = ResourcePrototypesElement;
