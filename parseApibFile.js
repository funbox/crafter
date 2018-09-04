const Crafter = require('./Crafter.js');
const yaml = require('yamljs');

module.exports =
  function parseApibFile(fileName, outputFormat) {
    const result = Crafter.parseFile(fileName);
    if (outputFormat === 'json') {
      return JSON.stringify(result.toRefract(), null, 2);
    }
    return yaml.stringify(result.toRefract(), Infinity, 2);
  };
