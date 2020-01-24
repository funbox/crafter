const Refract = require('../../Refract');
const utils = require('../../utils');
const SourceMapElement = require('./SourceMapElement');

/**
 * Параметр URL
 *
 * Пример:
 *
 * + Parameters
 *   + a (string, required)
 *
 * Дерево:
 *
 * ParametersElement
 *   parameters:
 *     - ParameterElement <--
 */
class ParameterElement {
  /**
   * @param {string} name
   * @param {string} value
   * @param {string} type
   * @param {(string|Array)[]}typeAttributes
   * @param {StringElement} description
   */
  constructor(name, value, type, typeAttributes, description) {
    const resolvedType = utils.resolveType(type);

    this.name = name;
    this.value = value;
    this.rawType = type;
    this.type = resolvedType.type;
    this.nestedTypes = resolvedType.nestedTypes;
    this.typeAttributes = typeAttributes;
    this.description = description;
    /**
     * @type {DefaultValueElement}
     */
    this.defaultValue = null;
    /**
     * @type {ParameterMembersElement}
     */
    this.enumerations = null;
    this.sourceMap = null;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file) : null;

    const result = {
      element: Refract.elements.member,
      content: {
        key: {
          element: Refract.elements.string,
          content: this.name,
          ...(sourceMapEl ? {
            attributes: { sourceMap: sourceMapEl.toRefract() },
          } : {}),
        },
        value: {
          element: Refract.elements.string,
        },
      },
      attributes: {
        typeAttributes: {
          element: Refract.elements.array,
          content: [],
        },
      },
    };

    if (this.type === Refract.elements.enum) {
      result.content.value.element = Refract.elements.enum;
    }

    if (this.value) {
      const value = {
        element: Refract.elements.string,
        content: this.value,
        ...(sourceMapEl ? {
          attributes: { sourceMap: sourceMapEl.toRefract() },
        } : {}),
      };

      result.content.value = this.type === Refract.elements.enum
        ? Object.assign({ content: value }, result.content.value) : value;
    }

    const typeAttributes = this.typeAttributes.length ? this.typeAttributes : ['required'];
    result.attributes.typeAttributes.content = typeAttributes.map(a => ({
      element: Refract.elements.string,
      content: a,
    }));

    if (this.description || this.rawType) {
      result.meta = {};
    }

    if (this.description) {
      result.meta.description = this.description.toRefract(sourceMapsEnabled);
    }

    if (this.rawType) {
      result.meta.title = {
        element: Refract.elements.string,
        content: this.rawType,
        ...(sourceMapEl ? {
          attributes: { sourceMap: sourceMapEl.toRefract() },
        } : {}),
      };
    }

    if (this.defaultValue || this.enumerations) {
      if (!result.content.value.attributes) {
        result.content.value.attributes = {};
      }
    }

    if (this.defaultValue) {
      result.content.value.attributes.default = this.defaultValue.toRefract(sourceMapsEnabled);
    }

    if (this.enumerations) {
      result.content.value.attributes.enumerations = this.enumerations.toRefract(sourceMapsEnabled);
    }

    return result;
  }
}

module.exports = ParameterElement;
