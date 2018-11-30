const fs = require('fs');
const path = require('path');
const Context = require('./Context');
const utils = require('./utils');
const Logger = require('./utils').Logger;

const Parsers = {};

fs.readdirSync(path.join(__dirname, 'parsers')).forEach((pFile) => {
  if (/Parser.js$/.exec(pFile)) {
    const defineParser = require(`./parsers/${pFile}`); // eslint-disable-line import/no-dynamic-require
    if (typeof defineParser === 'function') {
      defineParser(Parsers);
    }
  }
});

module.exports = {
  parse(source, contextOptions) {
    const ast = utils.markdownSourceToAST(source);
    contextOptions.logger = contextOptions.logger || new Logger();
    const context = new Context(source, Parsers, contextOptions);
    return Parsers.BlueprintParser.parse(ast.firstChild, context)[1];
  },

  parseFile(file, contextOptions = {}) {
    contextOptions.entryDir = path.dirname(file);
    contextOptions.logger = contextOptions.logger || new Logger();
    return this.parse(fs.readFileSync(file, { encoding: 'utf-8' }), contextOptions);
  },
};
