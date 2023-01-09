const fs = require('fs');
const path = require('path');
const Context = require('./Context');
const parsersList = require('./Parsers');
const utils = require('./utils');

const Parsers = {};
let prevPendingParsers = [];

function getOptions(options, defaultOptions) {
  return options === null || options === undefined || typeof options === 'function'
    ? defaultOptions
    : options;
}

/**
 * @param {string} source
 * @param {ContextOptions} contextOptions
 * @returns {array}
 */
async function parse(source, contextOptions) {
  const ast = utils.markdownSourceToAST(source);
  const context = new Context(source, Parsers, getOptions(contextOptions, {}));
  const result = await Parsers.BlueprintParser.parse(ast.firstChild, context);
  return result.slice(1);
}

async function parseFile(file, contextOptions) {
  const options = { ...getOptions(contextOptions, {}), entryDir: path.dirname(file), currentFile: file };
  return parse(await fs.promises.readFile(file, { encoding: 'utf-8' }), options);
}

function defineParsers(parsers) {
  const pendingParsers = [];
  parsers.forEach((parser) => {
    if (typeof parser === 'function') {
      const isDefined = parser(Parsers);
      if (typeof isDefined !== 'boolean') {
        throw new Error(`Expect parser function to return "true" or "false", but it returned ${isDefined}.`);
      }
      if (!isDefined) {
        pendingParsers.push(parser);
      }
    }
  });
  if (pendingParsers.length > 0) {
    if (prevPendingParsers.length && !(pendingParsers.length < prevPendingParsers.length)) {
      throw new Error('Something went wrong during parsers definition process');
    }
    prevPendingParsers = pendingParsers;
    defineParsers(pendingParsers);
  }
}

defineParsers(parsersList);

module.exports = {
  parse,
  parseFile,
};
