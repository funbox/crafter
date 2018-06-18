const primitiveTypes = [
  'string',
  'number',
  'boolean',
  ];
const object = 'object';
const array = 'array';
const enum_ = 'enum';

module.exports = {
  primitiveTypes,
  object,
  array,
  enum: enum_,
  standardTypes: primitiveTypes.concat([object, array]),
  nonObjectTypes: primitiveTypes.concat([array, enum_]),
};
