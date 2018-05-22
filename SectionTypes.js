const SectionTypes = Object.freeze({
  undefined: 'undefined',
  resource: 'resource',
  resourceGroup: 'resourceGroup',
  dataStructureGroup: 'dataStructureGroup',
  resourcePrototypes: 'resourcePrototypes',
  resourcePrototype: 'resourcePrototype',
  MSONNamedType: 'MSONNamedType',
  action: 'action',
  parameters: 'parameters',
  parameter: 'paramter',
  parameterDefaultValue: 'parameterDefaultValue',
  parameterMembers: 'parameterMembers',
  parameterMember: 'parameterMember',
  response: 'response',
  response: 'body',
  headers: 'headers',

  calculateSectionType(node, context, parsers) {
    let result = SectionTypes.undefined;

    for (let i = 0; i < parsers.length; i++) {
      result = parsers[i].sectionType(node, context);
      if (result !== SectionTypes.undefined) return result;
    }

    return result;
  }
});

module.exports = SectionTypes;