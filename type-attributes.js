const types = require('./types');

const typeAttributes = {
  required: 'required',
  optional: 'optional',
  fixed: 'fixed',
  'fixed-type': 'fixedType',
  nullable: 'nullable',
};

const parameterizedTypeAttributes = {
  pattern: { alias: 'pattern', dataType: 'string' },
  format: { alias: 'format', dataType: 'string' },
  'min-length': { alias: 'minLength', dataType: 'number' },
  'max-length': { alias: 'maxLength', dataType: 'number' },
  minimum: { alias: 'minimum', dataType: 'number' },
  maximum: { alias: 'maximum', dataType: 'number' },
};

const permittedValueTypeAttributes = {
  [types.object]: [
    typeAttributes.fixed,
    typeAttributes['fixed-type'],
    typeAttributes.nullable,
  ],
  [types.array]: [
    typeAttributes.fixed,
    typeAttributes['fixed-type'],
    typeAttributes.nullable,
    parameterizedTypeAttributes['min-length'].alias,
    parameterizedTypeAttributes['max-length'].alias,
  ],
  [types.enum]: [
    typeAttributes.fixed,
    typeAttributes.nullable,
  ],
  ...(types.primitiveTypes.reduce((acc, type) => {
    acc[type] = [
      typeAttributes.fixed,
      typeAttributes.nullable,
      ...Object.values(parameterizedTypeAttributes).map(v => v.alias),
    ];
    return acc;
  }, {})),
};

const fakeTypeAttributes = { sample: 'sample', default: 'default' };

module.exports = {
  typeAttributes,
  parameterizedTypeAttributes,
  permittedValueTypeAttributes,
  fakeTypeAttributes,
};
