const yaml = require('yamljs');
const Crafter = require('./Crafter');

module.exports = async function parseApibFile(fileName, outputFormat, sourceMapsEnabled, debugMode, languageServerMode, contextOptions = {}) {
  const result = (await Crafter.parseFile(fileName, { sourceMapsEnabled, debugMode, languageServerMode, ...contextOptions }))[0];
  if (outputFormat === 'json') {
    return JSON.stringify(result.toRefract(sourceMapsEnabled), null, 2);
  }
  return yaml.stringify(result.toRefract(sourceMapsEnabled), Infinity, 2);
};
