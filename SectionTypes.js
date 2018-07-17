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
  parameter: 'parameter',
  defaultValue: 'defaultValue',
  parameterMembers: 'parameterMembers',
  parameterMember: 'parameterMember',
  request: 'request',
  response: 'response',
  body: 'body',
  headers: 'headers',
  attributes: 'attributes',
  msonAttribute: 'msonAttribute',
  msonMixin: 'msonMixin',

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
