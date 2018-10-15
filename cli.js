#!/usr/bin/env node

const program = require('commander');
const parseApibFile = require('./parseApibFile');

program
  .usage('[options] <apib file>')
  .option('-f, --format [format]', 'output format of the Parse Result: yaml|json', /^(yaml|json)$/, 'yaml')
  .option('-s, --sourcemap', 'export sourcemap in the Parse Result')
  .parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

console.log(parseApibFile(program.args[0], program.format, program.sourcemap));
