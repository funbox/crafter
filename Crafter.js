const commonmark = require('commonmark');
const fs = require('fs');
const BlueprintParser = require('./parsers/BlueprintParser');
const Context = require('./Context');

module.exports = {
  parse(source) {
    const parser = new commonmark.Parser({sourcepos: true});
    const ast = parser.parse(source);
    const context = new Context(source);
    const [next, result] = BlueprintParser.parse(ast.firstChild, context);

    /*
    const printNode = (node, level) => {
      let space = '';
      for (let i = 0; i < level; i++) space = `${space} `;
      let content;
      if (node.type === 'text' || node.type === 'code') {
        content = node.literal;
      }
      console.log(`${space}${node.type}${content && ` (${content})` || ''}`);

      for (let child = node.firstChild; child !== null; child = child.next) {
        printNode(child, level + 1);
      }
    };

    printNode(ast, 0);
    */
    return result;
  },

  parseFile(file) {
    return this.parse(fs.readFileSync(file, {encoding: 'utf-8'}));
  }
};