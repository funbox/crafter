const SectionTypes = Object.freeze({
  undefined: 'undefined',
  resource: 'resource',
  resourceGroup: 'resourceGroup',
  subGroup: 'subGroup',
  dataStructureGroup: 'dataStructureGroup',
  schemaStructureGroup: 'schemaStructureGroup',
  resourcePrototypes: 'resourcePrototypes',
  resourcePrototype: 'resourcePrototype',
  MSONNamedType: 'MSONNamedType',
  schemaNamedType: 'schemaNamedType',
  action: 'action',
  namedAction: 'namedAction',
  parameters: 'parameters',
  parameter: 'parameter',
  defaultValue: 'defaultValue',
  defaultValueMember: 'defaultValueMember',
  sampleValue: 'sampleValue',
  sampleValueMember: 'sampleValueMember',
  parameterMembers: 'parameterMembers',
  parameterMember: 'parameterMember',
  enumMember: 'enumMember',
  arrayMember: 'arrayMember',
  request: 'request',
  response: 'response',
  body: 'body',
  headers: 'headers',
  attributes: 'attributes',
  schema: 'schema',
  msonAttribute: 'msonAttribute',
  msonMixin: 'msonMixin',
  msonObjectMemberGroup: 'msonObjectMemberGroup',
  msonArrayMemberGroup: 'msonArrayMemberGroup',
  msonEnumMemberGroup: 'msonEnumMemberGroup',
  oneOfType: 'oneOfType',
  oneOfTypeOption: 'oneOfTypeOption',
  message: 'message',
  import: 'import',

  /**
   * @param {object} node
   * @param {Context} context
   * @param {array} parsers
   * @returns {string}
   */
  calculateSectionType(node, context, parsers) {
    let result = SectionTypes.undefined;

    for (let i = 0; i < parsers.length; i += 1) {
      result = parsers[i].sectionType(node, context);
      if (result !== SectionTypes.undefined) return result;
    }

    return result;
  },
});

module.exports = SectionTypes;
