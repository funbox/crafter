const fs = require('fs');
const path = require('path');
const Context = require('./Context');
const utils = require('./utils');
const Logger = require('./utils').Logger;

const Parsers = {};

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : () => { throw new Error('Call of an asynchronous function without a callback'); };
}

function getOptions(options, defaultOptions) {
  return options === null || options === undefined || typeof options === 'function'
    ? defaultOptions
    : options;
}

function parse(source, contextOptions, callback) {
  callback = maybeCallback(callback || contextOptions);
  const options = getOptions(contextOptions, {});
  try {
    const result = parseSync(source, options);
    callback(undefined, result);
  } catch (error) {
    callback(error);
  }
}

function parseFile(file, contextOptions, callback) {
  callback = maybeCallback(callback || contextOptions);
  const options = getOptions(contextOptions, {});
  try {
    const result = parseFileSync(file, options);
    callback(undefined, result);
  } catch (error) {
    callback(error);
  }
}

function parseSync(source, contextOptions) {
  const ast = utils.markdownSourceToAST(source);
  contextOptions.logger = contextOptions.logger || new Logger();
  const context = new Context(source, Parsers, contextOptions);
  return Parsers.BlueprintParser.parse(ast.firstChild, context)[1];
}

function parseFileSync(file, contextOptions = {}) {
  contextOptions.entryDir = path.dirname(file);
  contextOptions.logger = contextOptions.logger || new Logger();
  return parseSync(fs.readFileSync(file, { encoding: 'utf-8' }), contextOptions);
}

fs.readdirSync(path.join(__dirname, 'parsers')).forEach((pFile) => {
  if (/Parser.js$/.exec(pFile)) {
    const defineParser = require(`./parsers/${pFile}`); // eslint-disable-line import/no-dynamic-require
    if (typeof defineParser === 'function') {
      defineParser(Parsers);
    }
  }
});

module.exports = {
  parse,
  parseSync,
  parseFile,
  parseFileSync,
};
