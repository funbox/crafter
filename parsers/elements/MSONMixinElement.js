const Refract = require('../../Refract');

/**
 * Include секция
 *
 * Пример:
 *
 * + foo
 *   + Include MyType <--
 *   + bar (string, required)
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

  /**
   * @param {boolean} sourceMapsEnabled
   */
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
   * @param {Set} resolvedTypes - типы из TypeResolver
   */
  getBody(resolvedTypes) {
    const typeEl = resolvedTypes[this.className];
    return typeEl.getBody(resolvedTypes);
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {object} flags - флаги генерации JSON Schema
   * @param {boolean} flags.isFixed
   * @param {boolean} flags.isFixedType
   * @param {boolean} flags.isNullable
   * @param {boolean} flags.skipTypesInlining
   */
  getSchema(resolvedTypes, flags = {}) {
    const typeEl = resolvedTypes[this.className];
    return typeEl.getSchema(resolvedTypes, flags);
  }
}

module.exports = MSONMixinElement;
