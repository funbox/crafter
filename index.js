const fs = require('fs');
const Crafter = require('./Crafter.js');
const yaml = require('yamljs');
const program = require('commander');

program
  .usage('[options] <apib file>')
  .option('-f, --format [format]', 'output format of the Parse Result: yaml|json', /^(yaml|json)$/, 'yaml')
  .parse(process.argv);

if (program.args.length === 0)
  program.help();

const data = fs.readFileSync(program.args[0], {encoding: 'utf-8'});
const result = Crafter.parse(data);
if (program.format === 'json') {
  console.log(JSON.stringify(result.toRefract(), null, 2));
} else {
  console.log(yaml.stringify(result.toRefract(), Infinity, 2));
}
