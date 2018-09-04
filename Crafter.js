const commonmark = require('commonmark');
const fs = require('fs');
const path = require('path');
const Context = require('./Context');

const Parsers = {};

fs.readdirSync('./parsers').forEach((pFile) => {
  if (/Parser.js$/.exec(pFile)) {
    const defineParser = require(`./parsers/${pFile}`); // eslint-disable-line import/no-dynamic-require
    if (typeof defineParser === 'function') {
      defineParser(Parsers);
    }
  }
});

module.exports = {
  parse(source, contextOptions) {
    const parser = new commonmark.Parser({ sourcepos: true });
    const ast = parser.parse(source);
    const context = new Context(source, Parsers, contextOptions);
    const result = Parsers.BlueprintParser.parse(ast.firstChild, context)[1];

    return result;
  },

  parseFile(file) {
    const contextOptions = {
      currentFile: path.resolve(__dirname, file),
    };
    return this.parse(fs.readFileSync(file, { encoding: 'utf-8' }), contextOptions);
  },
};
