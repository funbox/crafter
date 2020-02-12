const Refract = require('../../Refract');
const Flags = require('../../Flags');

/**
 * Include секция
 *
 * Пример:
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

  toRefract() {
    return {
      element: Refract.elements.ref,
      attributes: {
        path: {
          element: Refract.elements.string,
          content: 'content',
        },
      },
      content: this.className,
    };
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    const typeEl = dataTypes[this.className];
    return typeEl.getBody(dataTypes);
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(dataTypes, flags = new Flags()) {
    const typeEl = dataTypes[this.className];
    return typeEl.getSchema(dataTypes, flags);
  }
}

module.exports = MSONMixinElement;
