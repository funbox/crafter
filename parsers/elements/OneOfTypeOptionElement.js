const Refract = require('../../Refract');
const utilsHelpers = require('../../utils/index');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * Элемент секции One Of
 *
 * Пример:
 *
 * исходный текст:
 *   + One Of
 *     + foo
 *     + bar
 *
 * дерево:
 * OneOfTypeElement
 *   options:
 *     - OneOfTypeOptionElement <--
 *       members:
 *         - PropertyMemberElement
 *     - OneOfTypeOptionElement <--
 *       members:
 *         - PropertyMemberElement
 *
 * @see https://apielements.org/en/latest/element-definitions.html#option-element
 */
class OneOfTypeOptionElement {
  /**
   * @param {PropertyMemberElement[]} members
   * @param {SourceMap} sourceMap
   */
  constructor(members, sourceMap) {
    this.members = members;
    this.sourceMap = sourceMap;
  }

  /**
   * @param {boolean} sourceMapsEnabled
   */
  toRefract(sourceMapsEnabled) {
    const result = {
      element: Refract.elements.option,
      content: this.members.map(member => member.toRefract(sourceMapsEnabled)),
    };

    if (sourceMapsEnabled) {
      result.attributes = result.attributes || {};
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks, this.sourceMap.file);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   */
  getBody(dataTypes) {
    return this.members.reduce((body, member) => ({
      ...body,
      ...member.getBody(dataTypes),
    }), {});
  }

  /**
   * @param {DataTypes} dataTypes - типы из TypeResolver
   * @param {Flags} flags - флаги генерации JSON Schema
   */
  getSchema(dataTypes, flags = new Flags()) {
    let schema = {};
    const usedTypes = [];

    this.members.forEach(member => {
      const [memberSchema, memberUsedTypes] = member.getSchema(dataTypes, flags);
      schema = utilsHelpers.mergeSchemas(schema, memberSchema);
      usedTypes.push(...memberUsedTypes);
    });

    return [schema, usedTypes];
  }
}

module.exports = OneOfTypeOptionElement;
