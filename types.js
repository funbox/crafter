const primitiveTypes = [
  'string',
  'number',
  'boolean',
  'file',
];
const object = 'object';
const array = 'array';
const enum_ = 'enum'; // eslint-disable-line no-underscore-dangle

module.exports = {
  primitiveTypes,
  object,
  array,
  enum: enum_,
  standardTypes: primitiveTypes.concat([object, array, enum_]),
  nonObjectTypes: primitiveTypes.concat([array, enum_]),
};
