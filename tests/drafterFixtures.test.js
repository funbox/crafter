const child_process = require('child_process');
const fs = require('fs');
const rimraf = require('rimraf');
const Crafter = require('../Crafter');

const DRAFTER_REPO_URL = 'https://github.com/apiaryio/drafter.git';
const DRAFTER_BRANCH = 'master';
const DRAFTER_COMMIT = 'bda1cadd50bc2448b19aa9d0da5bc4cca938aefd'; // Oct 17, 2019
const FIXTURES_PATH = 'drafter/test/fixtures';
const APIB_REGEX = /\.apib$/;

const EXCLUDE_FIXTURES = [
  // Нет соответствующего JSON-файла
  'api/issue-386.apib',
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
};

test.each(apibFiles)('%s', filepath => {
  const result = Crafter.parseFileSync(filepath, { logger })[0];

  const jsonFilepath = filepath.replace(APIB_REGEX, '.json');
  const exampleFile = fs.readFileSync(jsonFilepath, { encoding: 'utf-8' });
  const example = JSON.parse(exampleFile);

  expect(result.toRefract()).toEqual(example);
});
