const { elements: { array } } = require('../../Refract');
const SourceMapElement = require('./SourceMapElement');

/**
 * Пример в структурах данных.
 * Создается только для примитивов или массивов примитивов (string, boolean, number).
 *
 * Пример:
 *
 * + Attributes
 *   + foo: bar (string) - в этом примере строка bar будет помещена в SampleValueElement
 *
 * дерево:
 * AttributesElement
 *   content: ValueMemberElement
 *     content: ObjectElement
 *       propertyMembers:
 *         - PropertyMemberElement
 *           value: ValueMemberElement
 *             samples:
 *               - SampleValueElement <--
 *                 type: "string"
 *                 value: "bar"

 */
class SampleValueElement {
  /**
   * @param {string|number|boolean|string[]|number[]|boolean[]} value
   * @param {string} type - тип значения
   * @param {SourceMap|SourceMap[]} sourceMap
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

  /** @private */
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

  /** @private */
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

module.exports = SampleValueElement;
