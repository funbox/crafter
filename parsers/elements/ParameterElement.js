const Refract = require('../../Refract');
const utils = require('../../utils');
const SourceMapElement = require('./SourceMapElement');
const StringElement = require('./StringElement');

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
 *
 * @see https://apielements.org/en/latest/element-definitions.html#member-element
 */
class ParameterElement {
  /**
   * @param {StringElement} name
   * @param {StringElement} value
   * @param {string} type
   * @param {string[]} typeAttributes - в данный момент здесь может быть только атрибут required
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
    const sourceMapEl = sourceMapsEnabled && this.sourceMap ? new SourceMapElement(this.sourceMap.byteBlocks) : null;

    const result = {
      element: Refract.elements.member,
      content: {
        key: this.name.toRefract(sourceMapsEnabled),
        value: this.getValue(sourceMapsEnabled),
      },
      attributes: {
        typeAttributes: {
          element: Refract.elements.array,
          content: [],
        },
      },
    };

    const typeAttributes = this.typeAttributes.length ? this.typeAttributes : [new StringElement('required')];
    result.attributes.typeAttributes.content = typeAttributes.map(attr => attr.toRefract(sourceMapsEnabled));

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

  getValue(sourceMapsEnabled) {
    const defaultValue = {
      element: this.type === Refract.elements.enum
        ? Refract.elements.enum
        : Refract.elements.string,
    };

    if (this.value) {
      return this.type === Refract.elements.enum
        ? { element: Refract.elements.enum, content: this.value.toRefract(sourceMapsEnabled) }
        : this.value.toRefract(sourceMapsEnabled);
    }

    return defaultValue;
  }
}

module.exports = ParameterElement;
