#!/usr/bin/env node

const program = require('commander');
const parseApibFile = require('./parseApibFile');
const { Logger } = require('./utils');

program
  .version(require('./package.json').version, '-v, --version')
  .usage('[options] <apib file>')
  .option('-f, --format [format]', 'output format of the Parse Result: yaml|json', /^(yaml|json)$/, 'yaml')
  .option('-s, --sourcemap', 'export sourcemap in the Parse Result')
  .option('-d, --debug', 'debug mode')
  .option('-l, --langserver', 'language server parsing mode')
  .parse(process.argv);

if (program.args.length === 0) {
  program.help();
}

const options = program.opts();

parseApibFile(
  program.args[0],
  options.format,
  options.sourcemap,
  options.debug,
  options.langserver,
  { logger: new Logger(console.error) },
).then(result => {
  console.log(result);
});
