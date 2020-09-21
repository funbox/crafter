const Refract = require('../../Refract');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * Секция One Of
 *
 * Пример:
 *
 * исходный текст:
 *   + One Of
 *     + foo
 *     + bar
 *
 * дерево:
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
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    if (this.options.length) {
      return this.options[0].getBody(dataTypes);
    }

    return {};
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
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
