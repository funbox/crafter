const path = require('path');
const fs = require('fs');

const apibRegex = /\.apib$/;
const dirsExcludeRegexp = /fixtures-with-errors/;
const apibExcludeRegexp = /(empty|-inner)\.apib$/;
const fixturesPath = `${__dirname}/fixtures`;
const fixtures = [];

walk(fixturesPath, file => {
  if (apibRegex.test(file) && !dirsExcludeRegexp.test(file) && !apibExcludeRegexp.test(file)) {
    fixtures.push(file);
  }
});

expect.extend({
  toBeConsecutive(received, smGapOffsets) {
    const pass = !received;
    if (pass) {
      return {
        message: () => 'sourcemaps are concatenated consecutively',
        pass: true,
      };
    }
    return {
      message: () => `expected to have no gaps in sourcemaps ${JSON.stringify(smGapOffsets)}`,
      pass: false,
    };
  },
});

describe('Sourcemaps of parseResult element must be concatenated consecutively', () => {
  fixtures.forEach(fixture => {
    const refract = JSON.parse(fs.readFileSync(`${fixture}`.replace(/\.apib$/, '.sm.json'), { encoding: 'utf8' }));
    const testName = fixture.replace(fixturesPath, '');

    if (refract.content[0].element === 'annotation' && !refract.content[0].attributes) {
      it.todo(`check ${testName}`);
    } else {
      it(testName, () => {
        const smGaps = [];

        const fileLengths = new Map();

        fileLengths.set(undefined, fs.readFileSync(fixture).length);
        const fixtureDir = path.dirname(fixture);

        const positionsForFiles = new Map();
        refract.content[0].attributes.sourceMap.content.forEach(({ content: sourceMapArray, file }) => {
          if (file && !fileLengths.get(file)) {
            fileLengths.set(file, fs.readFileSync(path.join(fixtureDir, file)).length);
          }

          let pos = positionsForFiles.get(file) || 0;
          sourceMapArray.forEach(sourceMap => {
            const offset = sourceMap.content[0].content;
            const length = sourceMap.content[1].content;

            if (pos !== offset) {
              smGaps.push({ file, pos, gap: offset - pos });
            }
            pos = offset + length;
          });

          positionsForFiles.set(file, pos);
        });

        positionsForFiles.forEach((pos, file) => {
          const fileLength = fileLengths.get(file);

          if (pos !== fileLength) {
            smGaps.push({ file, pos, gap: fileLength - pos });
          }
        });

        expect(smGaps).toHaveLength(0);
      });
    }
  });
});

function walk(dir, cb) {
  fs.readdirSync(dir).forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      walk(file, cb);
    } else {
      cb(file);
    }
  });
}
