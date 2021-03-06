const Refract = require('../../Refract');
const utils = require('../../utils');
const Flags = require('../../Flags');
const SourceMapElement = require('./SourceMapElement');

/**
 * One Of element section
 *
 * Example:
 *
 * source lines:
 *   + One Of
 *     + foo
 *     + bar
 *
 * resulting tree:
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
   * @param {StringElement} description
   * @param {SourceMap} sourceMap
   */
  constructor(members, description, sourceMap) {
    this.members = members;
    this.description = description;
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

    if (this.description) {
      result.meta = {
        description: this.description.toRefract(sourceMapsEnabled),
      };
    }

    if (sourceMapsEnabled) {
      result.attributes = result.attributes || {};
      const sourceMapEl = new SourceMapElement(this.sourceMap.byteBlocks);
      result.attributes.sourceMap = sourceMapEl.toRefract();
    }

    return result;
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   */
  getBody(dataTypes) {
    return this.members.reduce((body, member) => ({
      ...body,
      ...member.getBody(dataTypes),
    }), {});
  }

  /**
   * @param {DataTypes} dataTypes - types from TypeResolver
   * @param {Flags} flags - flags for JSON Schema generation
   */
  getSchema(dataTypes, flags = new Flags()) {
    let schema = {};
    const usedTypes = [];

    this.members.forEach(member => {
      const [memberSchema, memberUsedTypes] = member.getSchema(dataTypes, flags);
      schema = utils.mergeSchemas(schema, memberSchema);
      usedTypes.push(...memberUsedTypes);
    });

    return [schema, usedTypes];
  }
}

module.exports = OneOfTypeOptionElement;
