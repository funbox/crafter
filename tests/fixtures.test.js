const fs = require('fs');
const Crafter = require('../Crafter');

const files = fs.readdirSync(`${__dirname}/fixtures`);

const apibRegex = /\.apib$/;


describe('fixtures', () => {
  files.forEach(f => {
    if (apibRegex.exec(f)) {
      test(f, () => {
        const data = readFile(f);
        const example = JSON.parse(readFile(f.replace(apibRegex, '.json')));
        const result = Crafter.parse(data);
        expect(result).toEqual(example);
      });
    }
  });
});

function readFile(f) {
  return fs.readFileSync(`${__dirname}/fixtures/${f}`, {encoding: 'utf-8'});
}