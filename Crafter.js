const fs = require('fs');
const path = require('path');
const Context = require('./Context');
const utils = require('./utils');
const Logger = require('./utils').Logger;

const Parsers = {};
let prevPengingParsers = [];

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
    setTimeout(callback, 0, undefined, result);
  } catch (error) {
    setTimeout(callback, 0, error);
  }
}

function parseFile(file, contextOptions, callback) {
  callback = maybeCallback(callback || contextOptions);
  const options = getOptions(contextOptions, {});
  try {
    const result = parseFileSync(file, options);
    setTimeout(callback, 0, undefined, result);
  } catch (error) {
    setTimeout(callback, 0, error);
  }
}

function parseSync(source, contextOptions) {
  const ast = utils.markdownSourceToAST(source);
  contextOptions.logger = contextOptions.logger || new Logger();
  const context = new Context(source, Parsers, contextOptions);
  return Parsers.BlueprintParser.parse(ast.firstChild, context).slice(1);
}

function parseFileSync(file, contextOptions = {}) {
  contextOptions.entryDir = path.dirname(file);
  contextOptions.logger = contextOptions.logger || new Logger();
  return parseSync(fs.readFileSync(file, { encoding: 'utf-8' }), contextOptions);
}

function defineParsers(parsers) {
  const pendingParsers = [];
  parsers.forEach((pFile) => {
    if (/Parser.js$/.exec(pFile)) {
      const defineParser = require(`./parsers/${pFile}`); // eslint-disable-line import/no-dynamic-require
      if (typeof defineParser === 'function') {
        const isDefined = defineParser(Parsers);
        if (typeof isDefined !== 'boolean') {
          throw new Error(`Expect parser function "${pFile}" to return "true" or "false", but it returned ${isDefined}.`);
        }
        if (!isDefined) {
          pendingParsers.push(pFile);
        }
      }
    }
  });
  if (pendingParsers.length > 0) {
    if (prevPengingParsers.length && !(pendingParsers.length < prevPengingParsers.length)) {
      throw new Error('Something went wrong during parsers definition process');
    }
    prevPengingParsers = pendingParsers;
    defineParsers(pendingParsers);
  }
}

const parsers = fs.readdirSync(path.join(__dirname, 'parsers'));

defineParsers(parsers);

module.exports = {
  parse,
  parseSync,
  parseFile,
  parseFileSync,
};
