const Refract = require('../../Refract');
const utils = require('../../utils');
const utilsHelpers = require('../../utils/index');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * Секция Attributes
 *
 * Пример:
 *
 * + Attributes (string)
 *
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     type: string
 *
 * @see https://apielements.org/en/latest/element-definitions.html#data-structure
 */
class AttributesElement {
  /**
   * @param {ValueMemberElement} content
   * @param {SourceMap} sourceMap
   */
  constructor(content, sourceMap) {
    this.content = content;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.dataStructure,
      content: this.content.toRefract(sourceMapsEnabled),
    };

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    return this.content.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - всегда пустой объект, добавлен для единообразия
   */
  getSchema(dataTypes, flags = new Flags()) {
    const localFlags = new Flags(flags);

    const contentTypeEl = dataTypes[this.content.type];
    if (contentTypeEl && utils.typeIsUsedByElement(this.content.type, contentTypeEl, dataTypes)) {
      localFlags.skipTypesInlining = true;
    }

    const [result, usedTypes] = this.content.getSchema(dataTypes, utilsHelpers.mergeFlags(localFlags, this.content));

    const definitions = {};

    if (usedTypes.length > 0) {
      const types = usedTypes.filter((value, index) => usedTypes.indexOf(value) === index);

      while (types.length > 0) {
        const type = types.shift();
        const typeEl = dataTypes[type];
        const [typeSchema, typeUsedTypes] = typeEl.getSchema(dataTypes, { skipTypesInlining: true });
        definitions[type] = typeSchema;

        typeUsedTypes.forEach(t => {
          if (utils.typeIsReferred(t, typeSchema) && !types.includes(t) && !definitions[t]) {
            types.push(t);
          }
        });
      }
    }

    if (result) {
      return [
        {
          $schema: 'http://json-schema.org/draft-04/schema#',
          ...(Object.keys(definitions).length > 0 ? { definitions } : {}),
          ...result,
        },
      ];
    }

    return [result];
  }
}

module.exports = AttributesElement;
