const parseApibFile = require('./parseApibFile');

const filename = './tests/fixtures/recursive-objects/recursive-object.apib';
// const filename = './tests/fixtures/recursive-objects/recursive-object-optional.apib';
// const filename = './tests/fixtures/recursive-objects/nonrecursive-object.apib';
const format = 'json';
const sourcemap = false;

const result = parseApibFile(filename, format, sourcemap);

console.log(result);