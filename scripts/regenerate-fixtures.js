const path = require('path');
const fs = require('fs').promises;
const parseApibFile = require('../parseApibFile');

processApibFiles(path.resolve('tests/fixtures'));

async function processApibFiles(dir) {
  const dirContent = await fs.readdir(dir);
  await dirContent.reduce(async (res, item) => {
    await res;
    if ((await fs.stat(path.join(dir, item))).isDirectory()) {
      await processApibFiles(path.join(dir, item));
    } else if (path.extname(item) === '.apib' && !/-inner\.apib$/.test(item)) {
      const fileName = path.join(dir, item);
      const jsonFileName = fileName.slice(0, -5);
      await fs.writeFile(`${jsonFileName}.json`, `${await parseApibFile(fileName, 'json')}\n`);
      await fs.writeFile(`${jsonFileName}.sm.json`, `${await parseApibFile(fileName, 'json', true)}\n`);
    }
  }, Promise.resolve());
}
