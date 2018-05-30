const commonmark = require('commonmark');
const fs = require('fs');
const Context = require('./Context');

const Parsers = {};

fs.readdirSync('./parsers').forEach(pFile => {
  if (/Parser.js$/.exec(pFile)) {
    const defineParser = require(`./parsers/${pFile}`);
    if (typeof defineParser === 'function') {
      defineParser(Parsers);
    }
  }
});

module.exports = {
  parse(source) {
    const parser = new commonmark.Parser({sourcepos: true});
    const ast = parser.parse(source);
    const context = new Context(source, Parsers);
    const [next, result] = Parsers.BlueprintParser.parse(ast.firstChild, context);

    return result;
  },

  parseFile(file) {
    return this.parse(fs.readFileSync(file, {encoding: 'utf-8'}));
  }
};