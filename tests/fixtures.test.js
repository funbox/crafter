const fs = require('fs');
const Crafter = require('../Crafter');
const CrafterError = require('../utils').CrafterError;

const testPath = {
  base: `${__dirname}/fixtures`,
  get resourceProto() {
    return `${this.base}/resource-prototype`;
  },
  get arrays() {
    return `${this.base}/arrays`;
  },
  get enum() {
    return `${this.base}/enum`;
  },
  get oneOf() {
    return `${this.base}/one-of`;
  },
  get fixturesWithErrors() {
    return `${this.base}/fixtures-with-errors`;
  },
  get copy() {
    return `${this.base}/copy`;
  },
};

const apibRegex = /\.apib$/;

const testFilesFrom = (location) => {
  const path = location.path || location;
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f) && ((location.exclude && !location.exclude.test(f)) || !location.exclude)) {
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

describe('enum fixtures', () => {
  testFilesFrom(testPath.enum);
});

describe('one-of-type fixtures', () => {
  testFilesFrom(testPath.oneOf);
});

describe('fixtures with errors', () => {
  const path = testPath.fixturesWithErrors;
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f)) {
      it(f, () => {
        const data = readFile(f, path);
        expect(() => Crafter.parse(data)).toThrow(CrafterError);
      });
    }
  });
});

describe('copy fixtures', () => {
  testFilesFrom(testPath.copy);
});

function readFile(file, path) {
  return fs.readFileSync(`${path}/${file}`, { encoding: 'utf-8' });
}
