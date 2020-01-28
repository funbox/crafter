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
   * @param {Set} resolvedTypes - типы из TypeResolver
   */
  getBody(resolvedTypes) {
    const typeEl = resolvedTypes[this.className];
    return typeEl.getBody(resolvedTypes);
  }

  /**
   * @param {Set} resolvedTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(resolvedTypes, flags = new Flags()) {
    const typeEl = resolvedTypes[this.className];
    return typeEl.getSchema(resolvedTypes, flags);
  }
}

module.exports = MSONMixinElement;
