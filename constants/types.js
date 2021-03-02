const typesDefaults = {
  boolean: true,
  number: 1,
  string: 'hello',
  array: [],
  object: {},
  file: 'hello',
  enum: 'hello',
};

const types = Object.fromEntries(Object.keys(typesDefaults).map(k => [k, k]));
const primitiveTypes = [
  types.string,
  types.number,
  types.boolean,
  types.file,
];

module.exports = {
  defaults: typesDefaults,

  object: types.object,
  array: types.array,
  enum: types.enum,

  primitiveTypes,
  standardTypes: [
    ...primitiveTypes,
    types.object,
    types.array,
    types.enum,
  ],
  nonObjectTypes: [
    ...primitiveTypes,
    types.array,
    types.enum,
  ],
};
