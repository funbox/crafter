const Refract = require('../../Refract');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * Include section
 *
 * Example:
 *
 * + foo
 *   + Include MyType <--
 *   + bar (string, required)
 *
 * @see https://apielements.org/en/latest/element-definitions.html#ref-element
 */
class MSONMixinElement {
  /**
   * @param {string} className
   * @param sourceMap
   */
  constructor(className, sourceMap) {
    this.className = className;
    this.sourceMap = sourceMap;
  }

  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.ref,
      attributes: {
        path: {
          element: Refract.elements.string,
          content: 'content',
        },
      },
      content: this.className,
    };

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {string[]} namedTypesChain - named types used in the Body generation process are applicable to track recursive structures
   */
  getBody(dataTypes, namedTypesChain = []) {
    const typeEl = dataTypes[this.className];
    return typeEl.getBody(dataTypes, namedTypesChain);
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   * @param {string[]} namedTypesChain - named types used in the Schema generation process are applicable to track recursive structures
   */
  getSchema(dataTypes, flags = new Flags(), namedTypesChain = []) {
    const typeEl = dataTypes[this.className];
    return typeEl.getSchema(dataTypes, flags, namedTypesChain);
  }
}

module.exports = MSONMixinElement;
