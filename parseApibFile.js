const yaml = require('yamljs');
const Crafter = require('./Crafter.js');

module.exports = function parseApibFile(fileName, outputFormat, sourceMapsEnabled) {
  const result = Crafter.parseFileSync(fileName, { sourceMapsEnabled })[0];
  if (outputFormat === 'json') {
    return JSON.stringify(result.toRefract(sourceMapsEnabled), null, 2);
  }
  return yaml.stringify(result.toRefract(sourceMapsEnabled), Infinity, 2);
};
