const ActionParser = require('./parsers/ActionParser');
const ArrayMemberParser = require('./parsers/ArrayMemberParser');
const AttributesParser = require('./parsers/AttributesParser');
const BlueprintParser = require('./parsers/BlueprintParser');
const BodyParser = require('./parsers/BodyParser');
const DataStructureGroupParser = require('./parsers/DataStructureGroupParser');
const DefaultHeaderParser = require('./parsers/DefaultHeaderParser');
const DefaultValueParser = require('./parsers/DefaultValueParser');
const EnumMemberParser = require('./parsers/EnumMemberParser');
const HeadersParser = require('./parsers/HeadersParser');
const ImportParser = require('./parsers/ImportParser');
const MessageParser = require('./parsers/MessageParser');
const MSONAttributeParser = require('./parsers/MSONAttributeParser');
const MSONMemberGroupParser = require('./parsers/MSONMemberGroupParser');
const MSONMixinParser = require('./parsers/MSONMixinParser');
const MSONNamedTypeParser = require('./parsers/MSONNamedTypeParser');
const NamedTypeMemberGroupParser = require('./parsers/NamedTypeMemberGroupParser');
const OneOfTypeOptionParser = require('./parsers/OneOfTypeOptionParser');
const OneOfTypeParser = require('./parsers/OneOfTypeParser');
const ParameterEnumMemberParser = require('./parsers/ParameterEnumMemberParser');
const ParameterMembersParser = require('./parsers/ParameterMembersParser');
const ParameterParser = require('./parsers/ParameterParser');
const ParametersParser = require('./parsers/ParametersParser');
const RequestParser = require('./parsers/RequestParser');
const ResourceGroupParser = require('./parsers/ResourceGroupParser');
const ResourceParser = require('./parsers/ResourceParser');
const ResourcePrototypeParser = require('./parsers/ResourcePrototypeParser');
const ResourcePrototypesParser = require('./parsers/ResourcePrototypesParser');
const ResponseParser = require('./parsers/ResponseParser');
const SampleHeaderParser = require('./parsers/SampleHeaderParser');
const SampleValueParser = require('./parsers/SampleValueParser');
const SchemaNamedTypeParser = require('./parsers/SchemaNamedTypeParser');
const SchemaParser = require('./parsers/SchemaParser');
const SchemaStructureGroupParser = require('./parsers/SchemaStructureGroupParser');
const SubgroupParser = require('./parsers/SubgroupParser');

module.exports = [
  ActionParser,
  ArrayMemberParser,
  AttributesParser,
  BlueprintParser,
  BodyParser,
  DataStructureGroupParser,
  DefaultHeaderParser,
  DefaultValueParser,
  EnumMemberParser,
  HeadersParser,
  ImportParser,
  MessageParser,
  MSONAttributeParser,
  MSONMemberGroupParser,
  MSONMixinParser,
  MSONNamedTypeParser,
  NamedTypeMemberGroupParser,
  OneOfTypeOptionParser,
  OneOfTypeParser,
  ParameterEnumMemberParser,
  ParameterMembersParser,
  ParameterParser,
  ParametersParser,
  RequestParser,
  ResourceGroupParser,
  ResourceParser,
  ResourcePrototypeParser,
  ResourcePrototypesParser,
  ResponseParser,
  SampleHeaderParser,
  SampleValueParser,
  SchemaNamedTypeParser,
  SchemaParser,
  SchemaStructureGroupParser,
  SubgroupParser,
];
