const Refract = require('../../Refract');
const utils = require('../../utils');
const StringElement = require('./StringElement');
const SourceMapElement = require('./SourceMapElement');

/**
 * URL parameter
 *
 * Example:
 *
 * + Parameters
 *   + a (string, required)
 *
 * resulting tree:
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
   * @param {StringElement} title
   * @param {StringElement[]} typeAttributes - currently only required attribute can be here
   * @param {StringElement} description
   * @param {SourceMap} sourceMap
   */
  constructor(name, value, title, typeAttributes, description, sourceMap) {
    const resolvedType = utils.resolveType(title.string);

    this.name = name;
    this.value = value;
    this.title = title;
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
    /**
     * @type {UnrecognizedBlockElement[]}
     */
    this.unrecognizedBlocks = [];
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
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

    result.meta = {
      title: this.title.toRefract(sourceMapsEnabled),
    };

    if (this.description) {
      result.meta.description = this.description.toRefract(sourceMapsEnabled);
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

    if (sourceMapsEnabled) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    if (this.unrecognizedBlocks.length) {
      result.attributes.unrecognizedBlocks = {
        element: Refract.elements.array,
        content: this.unrecognizedBlocks.map(b => b.toRefract(sourceMapsEnabled)),
      };
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
