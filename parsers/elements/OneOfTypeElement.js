const Refract = require('../../Refract');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * One Of section
 *
 * Example:
 *
 * source lines:
 *   + One Of
 *     + foo
 *     + bar
 *
 * resulting tree:
 * OneOfTypeElement <--
 *   options:
 *     - OneOfTypeOptionElement
 *     - OneOfTypeOptionElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#select-element
 */
class OneOfTypeElement {
  /**
   * @param {SourceMap} sourceMap
   */
  constructor(sourceMap) {
    /**
     * @type {OneOfTypeOptionElement[]}
     */
    this.options = [];
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.select,
      content: this.options.map(option => option.toRefract(sourceMapsEnabled)),
    };

    if (sourceMapsEnabled) {
      result.attributes = result.attributes || {};
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {string[]} namedTypesChain - named types used in the Body generation process are applicable to track recursive structures
   * @param {number} index
   */
  getBody(dataTypes, namedTypesChain, index) {
    if (this.options.length) {
      return {
        [`__oneOf-${index}__`]: this.options.map(option => option.getBody(dataTypes)),
      };
    }

    return {};
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   */
  getSchema(dataTypes, flags = new Flags()) {
    const usedTypes = [];
    const schema = {
      oneOf: this.options.map(option => {
        const [optionSchema, optionUsedTypes] = option.getSchema(dataTypes, flags);
        usedTypes.push(...optionUsedTypes);
        return optionSchema;
      }),
    };

    return [schema, usedTypes];
  }
}

module.exports = OneOfTypeElement;
