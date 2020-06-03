#!/usr/bin/env node

const program = require('commander');
const parseApibFile = require('./parseApibFile');
const Logger = require('./utils').Logger;

program
  .version(require('./package').version, '-v, --version')
  .usage('[options] <apib file>')
  .option('-f, --format [format]', 'output format of the Parse Result: yaml|json', /^(yaml|json)$/, 'yaml')
  .option('-s, --sourcemap', 'export sourcemap in the Parse Result')
  .option('-d, --debug', 'debug mode')
  .parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

parseApibFile(program.args[0], program.format, program.sourcemap, program.debug, false, { logger: new Logger() }).then(result => {
  console.log(result);
});
