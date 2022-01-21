const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * Attributes section
 *
 * Example:
 *
 * + Attributes (string)
 *
 * resulting tree:
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
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   */
  getBody(dataTypes) {
    return this.content.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - always empty, added for consistency
   */
  getSchema(dataTypes, flags = new Flags()) {
    const localFlags = new Flags(flags);

    const contentTypeEl = dataTypes[this.content.type];
    if (contentTypeEl && utils.isTypeUsedByElement(this.content.type, contentTypeEl, dataTypes)) {
      localFlags.skipTypesInlining = true;
    }

    const [result, usedTypes] = this.content.getSchema(dataTypes, utils.mergeFlags(localFlags, this.content));

    const definitions = {};

    if (usedTypes.length > 0) {
      const types = usedTypes.filter((value, index) => usedTypes.indexOf(value) === index);

      while (types.length > 0) {
        const type = types.shift();
        const typeEl = dataTypes[type];
        const [typeSchema, typeUsedTypes] = typeEl.getSchema(dataTypes, { skipTypesInlining: true });
        definitions[type] = typeSchema;

        typeUsedTypes.forEach(t => {
          if (utils.isTypeReferred(t, typeSchema) && !types.includes(t) && !definitions[t]) {
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
