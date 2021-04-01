const path = require('path');
const fs = require('fs').promises;
const parseApibFile = require('../parseApibFile');

const apibRegex = /\.apib$/;
const apibInnerRegexp = /-inner\.apib$/;

processApibFiles(path.resolve('tests/fixtures')).catch(logRegenerationError);
processLanguageServerFiles(path.resolve('tests/language-server')).catch(logRegenerationError);

async function processApibFiles(dir) {
  const dirContent = await fs.readdir(dir);
  await dirContent.reduce(async (res, item) => {
    await res;
    if ((await fs.stat(path.join(dir, item))).isDirectory()) {
      await processApibFiles(path.join(dir, item));
    } else if (apibRegex.test(item) && !apibInnerRegexp.test(item)) {
      const fileName = path.join(dir, item);
      const jsonFileName = fileName.slice(0, -5);
      try {
        await fs.writeFile(`${jsonFileName}.json`, `${await parseApibFile(fileName, 'json')}\n`);
        await fs.writeFile(`${jsonFileName}.sm.json`, `${await parseApibFile(fileName, 'json', true)}\n`);
      } catch (e) {
        e.file = fileName;
        throw e;
      }
    }
  }, Promise.resolve());
}

async function processLanguageServerFiles(dir) {
  const dirContent = await fs.readdir(dir);

  await dirContent.reduce(async (res, item) => {
    await res;
    if (apibRegex.test(item) && !apibInnerRegexp.test(item)) {
      const fileName = path.join(dir, item);
      try {
        const jsonFileName = fileName.replace(apibRegex, '.json');
        await fs.writeFile(jsonFileName, `${await parseApibFile(fileName, 'json', false, false, true)}\n`);
      } catch (e) {
        e.file = fileName;
        throw e;
      }
    }
  }, Promise.resolve());
}

function logRegenerationError(e) {
  console.error(`Fixtures regeneration emitted an error in file ${e.file}`);
  console.log(e);
}
