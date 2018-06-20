const fs = require('fs');
const Crafter = require('./Crafter.js');
const yaml = require('yamljs');

module.exports =
  function parseApibFile(fileName, outputFormat) {
    const data = fs.readFileSync(fileName, {encoding: 'utf-8'});
    const result = Crafter.parse(data);
    if (outputFormat === 'json') {
      return JSON.stringify(result.toRefract(), null, 2);
    } else {
      return yaml.stringify(result.toRefract(), Infinity, 2);
    }
  };
