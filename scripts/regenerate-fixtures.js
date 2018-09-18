const path = require('path');
const fs = require('fs');
const parseApibFile = require('../parseApibFile');

const excludedDirs = ['fixtures-with-errors'];

processApibFiles(path.resolve('tests/fixtures'));

function processApibFiles(dir) {
  const dirContent = fs.readdirSync(dir);
  dirContent.forEach((item) => {
    if (fs.statSync(path.join(dir, item)).isDirectory() && !excludedDirs.includes(item)) {
      processApibFiles(path.join(dir, item));
    } else if (path.extname(item) === '.apib') {
      const fileName = path.join(dir, item);
      const jsonFileName = fileName.slice(0, -5);
      fs.writeFileSync(`${jsonFileName}.json`, `${parseApibFile(fileName, 'json')}\n`);
      fs.writeFileSync(`${jsonFileName}.sm.json`, `${parseApibFile(fileName, 'json', { sourceMapsEnabled: true })}\n`);
    }
  });
}
