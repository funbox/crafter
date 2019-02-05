const yaml = require('yamljs');
const Crafter = require('./Crafter.js');

module.exports = function parseApibFile(fileName, outputFormat, sourceMapsEnabled) {
  const result = Crafter.parseFileSync(fileName, { sourceMapsEnabled });
  if (outputFormat === 'json') {
    return JSON.stringify(result.toRefract(), null, 2);
  }
  return yaml.stringify(result.toRefract(), Infinity, 2);
};
