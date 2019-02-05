const child_process = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const Crafter = require('../Crafter');

const DRAFTER_REPO_URL = 'https://github.com/apiaryio/drafter.git';
const DRAFTER_BRANCH = 'master';
const DRAFTER_COMMIT = '163898cd6ba51655b30ba5dc97395047ba860267'; // 17 ноября 2018.
const FIXTURES_PATH = 'drafter/test/fixtures';
const APIB_REGEX = /\.apib$/;

const EXCLUDE_FIXTURES = [
  // Нет соответствующего JSON-файла
  'api/issue-386.apib',

  // Allocation failed - JavaScript heap out of memory
  'mson/resource-anonymous.apib',
  'syntax/undisclosed-listitem.apib',

  // Парсинг прерывается с ошибкой
  'api/attributes-named-type-enum-reference.apib',
  'api/attributes-named-type-member-reference.apib',
  'api/mson.apib',
  'api/resource-parameters.apib',
  'circular/array-in-object.apib',
  'circular/array.apib',
  'circular/cross.apib',
  'circular/embed.apib',
  'circular/enum.apib',
  'circular/mixed.apib',
  'circular/mixin-cross.apib',
  'circular/mixin-embed.apib',
  'circular/mixin-identity.apib',
  'circular/mixin-member.apib',
  'circular/simple.apib',
  'extend/circular.apib',
  'mson/array-typed-content.apib',
  'mson/check-default-without-value.apib',
  'mson/check-sample-without-value.apib',
  'mson/enum-multiple-default.apib',
  'mson/enum-variants.apib',
  'mson/enumerations.apib',
  'mson/inheritance-primitive.apib',
  'mson/inheritance.apib',
  'mson/mixin-nonexistent.apib',
  'mson/multiline-description.apib',
  'mson/multiple-default.apib',
  'mson/nontyped-array-sample.apib',
  'mson/primitives.apib',
  'mson/regression-269.apib',
  'mson/resource-resolve-basetype.apib',
  'mson/string-sample.apib',
  'mson/type-attributes.apib',
  'oneof/expanded.apib',
  'parse-result/error-warning.apib',
  'render/array-samples.apib',
  'render/inheritance-object-sample.apib',
  'render/issue-312.apib',
  'render/mixin-object-sample.apib',
  'render/primitive-samples.apib',
  'schema/default-attribute.apib',
  'schema/description.apib',
  'schema/enum-containing-object.apib',
  'schema/escaping.apib',
  'syntax/mixed-inheritance-and-mixin.apib',
].map(path => `${FIXTURES_PATH}/${path}`);

function shouldSkip(pathname) {
  return EXCLUDE_FIXTURES.includes(pathname);
}

function getApibFiles(path = FIXTURES_PATH) {
  const filesAndDirectories = fs.readdirSync(path).map(name => `${path}/${name}`)
    .filter(pathname => !shouldSkip(pathname));

  const files = filesAndDirectories.filter(f => APIB_REGEX.test(f) && fs.statSync(f).isFile());

  const directories = filesAndDirectories.filter(dir => fs.statSync(dir).isDirectory());

  return directories.reduce((acc, dir) => acc.concat(getApibFiles(dir)), files);
}

afterAll(() => {
  rimraf.sync('drafter');
});


rimraf.sync('drafter');

child_process.execSync(`git clone -b ${DRAFTER_BRANCH} -q ${DRAFTER_REPO_URL} --single-branch`);
child_process.execSync(`cd drafter && git reset --hard ${DRAFTER_COMMIT}`);

const apibFiles = getApibFiles();

const logger = {
  warn() {},
  enableWarnings() {},
  suppressWarnings() {},
};

test.each(apibFiles)('%s', filepath => {
  const result = Crafter.parseFileSync(filepath, { logger });

  const jsonFilepath = filepath.replace(APIB_REGEX, '.json');
  const exampleFile = fs.readFileSync(jsonFilepath, { encoding: 'utf-8' });
  const example = JSON.parse(exampleFile);

  expect(result.toRefract()).toEqual(example);
});
