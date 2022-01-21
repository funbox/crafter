const { elements: { array } } = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * An element to keep the default value.
 * Can be created only for primitive values or arrays of primitive (string, boolean, number)
 *
 * Example:
 *
 * source lines:
 * + Attributes
 *   + foo: bar (string, default)
 *
 * resulting tree:
 * AttributesElement
 *   content: ValueMemberElement
 *     content: ObjectElement
 *       propertyMembers:
 *         - PropertyMemberElement
 *           value: ValueMemberElement
 *             default: DefaultValueElement <--
 *               type: "string"
 *               value: "bar"
 */
class DefaultValueElement {
  /**
   * @param {string|number|boolean|string[]|number[]|boolean[]} value
   * @param {string} type — value type
   * @param sourceMap
   */
  constructor(value, type, sourceMap) {
    this.value = value;
    this.type = type;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    if (Array.isArray(this.value)) {
      return this.toRefractForArray(sourceMapsEnabled);
    }

    return this.toRefractForPrimitive(sourceMapsEnabled);
  }

  toRefractForArray(sourceMapsEnabled) {
    return {
      element: array,
      content: this.value.map((v, i) => {
        const result = {
          element: this.type,
          content: v,
        };

        if (sourceMapsEnabled && this.sourceMap[i]) {
          const sourceMapEl = new SourceMapElement(this.sourceMap[i].byteBlocks);
          result.attributes = {
            sourceMap: sourceMapEl.toRefract(),
          };
        }

        return result;
      }),
    };
  }

  toRefractForPrimitive(sourceMapsEnabled) {
    const result = {
      element: this.type,
      content: this.value,
    };

    if (sourceMapsEnabled && this.sourceMap) {
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes = {
        sourceMap: sourceMapEl.toRefract(),
      };
    }

    return result;
  }

  getBody() {
    return this.value;
  }
}

module.exports = DefaultValueElement;
