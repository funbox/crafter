const commonmark = require('@funbox/commonmark');

module.exports = function markdownSourceToAST(source) {
  const parser = new commonmark.Parser({ sourcepos: true });
  const ast = parser.parse(source);

  return ast;
};
