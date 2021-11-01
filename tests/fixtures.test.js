const fs = require('fs');
const apiElements = require('api-elements');
const Crafter = require('../Crafter');

const elements = new apiElements.Namespace();

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
    return {
      path: `${this.base}/fixtures-with-errors`,
      exclude: /-inner\.apib$/,
    };
  },
  get fixturesWithWarnings() {
    return {
      path: `${this.base}/fixtures-with-warnings`,
      exclude: /-inner\.apib$/,
    };
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
  get schema() {
    return `${this.base}/schema`;
  },
  get pattern() {
    return `${this.base}/pattern`;
  },
  get format() {
    return `${this.base}/format`;
  },
  get fixedSize() {
    return `${this.base}/fixed-size`;
  },
  get messageGroups() {
    return `${this.base}/message-groups`;
  },
  get recursiveArrays() {
    return `${this.base}/recursive-arrays`;
  },
  get recursiveObjects() {
    return `${this.base}/recursive-objects`;
  },
  get duplicates() {
    return `${this.base}/duplicates`;
  },
  get inheritance() {
    return `${this.base}/inheritance`;
  },
};

const apibRegex = /\.apib$/;

const testFilesFrom = (location, allowErrors) => {
  const path = location.path || location;
  const files = fs.readdirSync(path);
  files.forEach((f) => {
    if (apibRegex.exec(f) && ((location.exclude && !location.exclude.test(f)) || !location.exclude)) {
      test(f, async () => {
        const logger = {
          store: undefined,
          warn(text) {
            this.store = text;
          },
        };
        const filePath = `${path}/${f}`;
        const example = await getMatchingData(f, path);
        const result = (await Crafter.parseFile(filePath, { logger }))[0];
        const refract = result.toRefract();
        expect(refract).toEqual(example);
        expect(() => {
          elements.fromRefract(refract);
        }).not.toThrowError();

        const error = refract.content.find(item => item.element === 'annotation' && item.meta.classes.content[0].content === 'error');
        if (!allowErrors) {
          expect(error).toBeUndefined();
        }

        const exampleSm = await getMatchingData(f, path, true);
        const resultSm = (await Crafter.parseFile(filePath, { logger, sourceMapsEnabled: true }))[0];
        expect(resultSm.toRefract(true)).toEqual(exampleSm);

        if (/has-warning/.test(f)) {
          expect(logger.store).toBeDefined();
          expect(typeof logger.store).toBe('string');
        } else if (logger.store) {
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
  testFilesFrom(testPath.fixturesWithErrors, true);
});

describe('fixtures with warnings', () => {
  testFilesFrom(testPath.fixturesWithWarnings);
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

describe('schema fixtures', () => {
  testFilesFrom(testPath.schema);
});

describe('pattern fixtures', () => {
  testFilesFrom(testPath.pattern);
});

describe('format fixtures', () => {
  testFilesFrom(testPath.format);
});

describe('fixed-size fixtures', () => {
  testFilesFrom(testPath.fixedSize);
});

describe('fixtures with subgroups and messages', () => {
  testFilesFrom(testPath.messageGroups);
});

describe('recursive arrays fixtures', () => {
  testFilesFrom(testPath.recursiveArrays);
});

describe('recursive object fixtures', () => {
  testFilesFrom(testPath.recursiveObjects);
});

describe('fixtures with duplicated resources', () => {
  testFilesFrom(testPath.duplicates);
});

describe('fixtures with inheritance', () => {
  testFilesFrom(testPath.inheritance);
});

describe('Crafter isError field', () => {
  it('Parses a source with and without options', async () => {
    const file = 'simple.apib';
    const path = testPath.base;
    const options = {};
    const source = await readFile(file, path);
    const example = await getMatchingData(file, path);

    const result1 = await Crafter.parse(source, options);
    expect(result1[0].toRefract()).toEqual(example);
    expect(result1[0].isError).toBe(false);

    const result2 = await Crafter.parse(source);
    expect(result2[0].toRefract()).toEqual(example);
    expect(result2[0].isError).toBe(false);
  });

  it('Returns an error with and without options', async () => {
    const file = 'undefined-data-type.apib';
    const path = testPath.fixturesWithErrors.path;
    const options = {};
    const source = await readFile(file, path);

    const result1 = await Crafter.parse(source, options);
    expect(result1[0].isError).toBe(true);

    const result2 = await Crafter.parse(source);
    expect(result2[0].isError).toBe(true);
  });
});

describe('Crafter in debug mode', () => {
  it('Returns an error in debug mode during structures preprocessing', async () => {
    const logger = {
      store: undefined,
      warn(text) {
        this.store = text;
      },
    };
    const filePath = `${testPath.fixturesWithErrors.path}/undefined-mixin-in-data-structure.apib`;

    await expect(Crafter.parseFile(filePath, { logger, sourceMapsEnabled: true, debugMode: true }))
      .rejects
      .toThrow('Mixin "(BaseResponse)" is not defined in the document.');
  });

  it('Returns an error in debug mode during regular processing', async () => {
    const logger = {
      store: undefined,
      warn(text) {
        this.store = text;
      },
    };
    const filePath = `${testPath.fixturesWithErrors.path}/array-mixin-in-enum.apib`;

    await expect(Crafter.parseFile(filePath, { logger, sourceMapsEnabled: true, debugMode: true }))
      .rejects
      .toThrow('Mixin base type should be the same as parent base type: enums should contain enum mixins.');
  });
});

it('parses from source without options passed', async () => {
  const file = 'simple.apib';
  const path = testPath.base;
  const options = {};

  await testFromSource(file, path, options);
});

it('parses from source and includes imports', async () => {
  const file = 'resource.apib';
  const path = testPath.import.path;
  const options = { entryDir: path };

  await testFromSource(file, path, options);
});

it('parses from source and includes nested imports', async () => {
  const file = 'nested.apib';
  const path = testPath.import.path;
  const options = { entryDir: path };

  await testFromSource(file, path, options);
});

it('parses from source and includes all used file paths', async () => {
  const file = 'nested.apib';
  const path = testPath.import.path;
  const options = { entryDir: path };

  const source = await readFile(file, path);
  const filePaths = (await Crafter.parse(source, options))[1];

  expect(filePaths).toEqual(['nested/nested-inner.apib', 'nested-next-level-inner.apib']);
});

it('throws an error when parsing from source with imports and without entryDir option defined', async () => {
  const file = 'nested.apib';
  const path = testPath.import.path;
  const options = {};

  const source = await readFile(file, path);

  expect((await Crafter.parse(source, options))[0].isError).toBe(true);
});

it('parses file using custom file reader', async () => {
  const options = {
    entryDir: 'foo/bar',
    readFile: readImport,
  };

  let importedFile;

  const result = await Crafter.parse('# My API\n# Import inner.apib', options);
  expect(result[0].isError).toBe(false);
  expect(importedFile).toBe('foo/bar/inner.apib');

  async function readImport(fname) {
    importedFile = fname;
    return '# GET /foo\n+Response 200';
  }
});

function readFile(file, path) {
  return fs.promises.readFile(`${path}/${file}`, { encoding: 'utf-8' });
}

async function getMatchingData(file, path, isSourceMaps = false) {
  const ext = !isSourceMaps ? '.json' : '.sm.json';
  return JSON.parse(await readFile(file.replace(apibRegex, ext), path));
}

async function testFromSource(file, path, options) {
  const source = await readFile(file, path);

  const result = (await Crafter.parse(source, options))[0];
  const example = await getMatchingData(file, path);
  expect(result.toRefract()).toEqual(example);

  options.sourceMapsEnabled = true;
  const resultSm = (await Crafter.parse(source, options))[0];
  const exampleSm = await getMatchingData(file, path, options.sourceMapsEnabled);
  expect(resultSm.toRefract(true)).toEqual(exampleSm);
}
