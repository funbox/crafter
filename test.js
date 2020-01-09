const parseApibFile = require('./parseApibFile');

// const filename = './tests/fixtures/recursive-objects/recursive-object.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-deep.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-fixed-inherited-error.apib';
const filename = './tests/fixtures/recursive-objects/recursive-object-fixed-inherited-attributes-error.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-fixed-error.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-fixed-type-error.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-additional-properties-error.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-optional.apib';

const format = 'json';
const sourcemap = false;

const result = parseApibFile(filename, format, sourcemap);

console.log(result.split('\n').slice(-10).join('\n'));

// console.log(result);
