const fs = require('fs');
const resolvePath = require('path').resolve;
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
  get import() {
    return {
      path: `${this.base}/import`,
      exclude: /(-inner|-next)\.apib$/,
    };
  },
  get fixturesWithErrors() {
    return `${this.base}/fixtures-with-errors`;
  },
  get fixturesWithWarnings() {
    return `${this.base}/fixtures-with-warnings`;
  },
  get copy() {
    return `${this.base}/copy`;
  },
  get wrongSections() {
    return `${this.base}/wrong-sections`;
  },
  get sourceMaps() {
    return `${this.base}/source-maps`;
  },
  get groupMemberSeparators() {
    return `${this.base}/group-member-separators`;
  },
  get blockDescription() {
    return `${this.base}/block-description`;
  },
};

const apibRegex = /\.apib$/;

const testFilesFrom = (location) => {
  const path = location.path || location;
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f) && ((location.exclude && !location.exclude.test(f)) || !location.exclude)) {
      test(f, () => {
        const logger = {
          store: undefined,
          warn(text) {
            this.store = text;
          },
          enableWarnings() {},
          suppressWarnings() {},
        };
        const filePath = `${path}/${f}`;
        const example = getMatchingData(f, path);
        const result = Crafter.parseFile(filePath, { logger });
        expect(result.toRefract()).toEqual(example);

        const exampleSm = getMatchingData(f, path, true);
        const resultSm = Crafter.parseFile(filePath, { logger, sourceMapsEnabled: true });
        expect(resultSm.toRefract()).toEqual(exampleSm);

        if (logger.store && !/has-warning/.test(f)) {
          throw new Error(`Unexpected warning in file "${f}".\nAdd the postfix "has-warning" to filename, if the file is supposed to emit a warning.`);
        }
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

describe('import fixtures', () => {
  testFilesFrom(testPath.import);
});

describe('wrong-sections fixtures', () => {
  testFilesFrom(testPath.wrongSections);
});

describe('fixtures with errors', () => {
  const path = testPath.fixturesWithErrors;
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f)) {
      it(f, () => {
        const filePath = `${path}/${f}`;
        expect(() => Crafter.parseFile(filePath)).toThrow(CrafterError);
      });
    }
  });
});

describe('fixtures with warnings', () => {
  const path = testPath.fixturesWithWarnings;
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f)) {
      it('should create warnings via logger', () => {
        const data = readFile(f, path);
        const logger = {
          store: undefined,
          warn(text) {
            this.store = text;
          },
          enableWarnings() {},
          suppressWarnings() {},
        };
        const opts = {
          currentFile: resolvePath(__dirname, f),
          logger,
        };
        Crafter.parse(data, opts).toRefract();
        expect(logger.store).toBeDefined();
        expect(typeof logger.store).toBe('string');
      });
    }
  });
});

describe('copy fixtures', () => {
  testFilesFrom(testPath.copy);
});

describe('source maps fixtures', () => {
  testFilesFrom(testPath.sourceMaps);
});

describe('fixtures with member separators', () => {
  testFilesFrom(testPath.groupMemberSeparators);
});

describe('fixtures with block description', () => {
  testFilesFrom(testPath.blockDescription);
});

it('parses from source without options passed', () => {
  const file = 'simple.apib';
  const path = testPath.base;
  const options = {};

  testFromSource(file, path, options);
});

it('parses from source and includes imports', () => {
  const file = 'action.apib';
  const path = testPath.import.path;
  const options = { entryDir: path };

  testFromSource(file, path, options);
});

it('parses from source and includes nested imports', () => {
  const file = 'nested.apib';
  const path = testPath.import.path;
  const options = { entryDir: path };

  testFromSource(file, path, options);
});

it('throws an error when parsing from source with imports and without entryDir option defined', () => {
  const file = 'nested.apib';
  const path = testPath.import.path;
  const options = {};

  const source = readFile(file, path);

  expect(() => Crafter.parse(source, options)).toThrow(CrafterError);
});

function readFile(file, path) {
  return fs.readFileSync(`${path}/${file}`, { encoding: 'utf-8' });
}

function getMatchingData(file, path, isSourceMaps = false) {
  const ext = !isSourceMaps ? '.json' : '.sm.json';
  return JSON.parse(readFile(file.replace(apibRegex, ext), path));
}

function testFromSource(file, path, options) {
  const source = readFile(file, path);

  const result = Crafter.parse(source, options);
  const example = getMatchingData(file, path);
  expect(result.toRefract()).toEqual(example);

  options.sourceMapsEnabled = true;
  const resultSm = Crafter.parse(source, options);
  const exampleSm = getMatchingData(file, path, options.sourceMapsEnabled);
  expect(resultSm.toRefract()).toEqual(exampleSm);
}
