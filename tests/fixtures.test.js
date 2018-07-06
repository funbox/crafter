const fs = require('fs');
const Crafter = require('../Crafter');

const testPath = {
  base: `${__dirname}/fixtures`,
  get resourceProto() {
    return `${this.base}/resource-prototype`;
  },
  get arrays() {
    return `${this.base}/arrays`;
  },
};

const apibRegex = /\.apib$/;

const testFilesFrom = (path) => {
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f)) {
      test(f, () => {
        const data = readFile(f, path);
        const example = JSON.parse(readFile(f.replace(apibRegex, '.json'), path));
        const result = Crafter.parse(data);
        expect(result.toRefract()).toEqual(example);
      });
    }
  });
};

describe('common fixtures', () => {
  testFilesFrom(testPath.base);
});

describe('resource-proto fixtures', () => {
  testFilesFrom(testPath.resourceProto);
});

describe('arrays fixtures', () => {
  testFilesFrom(testPath.arrays);
});

function readFile(file, path) {
  return fs.readFileSync(`${path}/${file}`, { encoding: 'utf-8' });
}
