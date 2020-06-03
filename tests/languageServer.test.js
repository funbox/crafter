const fs = require('fs');
const Crafter = require('../Crafter');

const apibRegex = /\.apib$/;
const fixturesPath = `${__dirname}/language-server`;
const fixtures = fs.readdirSync(fixturesPath).filter(f => apibRegex.exec(f));

describe('language server', () => {
  fixtures.forEach(fixture => {
    it(fixture, () => {
      const sourceFilePath = `${fixturesPath}/${fixture}`;
      const resultFilePath = `${fixturesPath}/${fixture.replace(apibRegex, '.json')}`;
      const expectedResult = JSON.parse(fs.readFileSync(resultFilePath, { encoding: 'utf-8' }));

      const result = Crafter.parseFileSync(sourceFilePath, { languageServerMode: true })[0].toRefract();
      expect(result).toEqual(expectedResult);
    });
  });
});
