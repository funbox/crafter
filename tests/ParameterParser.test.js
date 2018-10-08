const fs = require('fs');
const Context = require('../Context');
const utils = require('../utils');

const Parsers = {};
fs.readdirSync('./parsers').forEach((pFile) => {
  if (/Parser.js$/.exec(pFile)) {
    const defineParser = require(`../parsers/${pFile}`); // eslint-disable-line import/no-dynamic-require
    if (typeof defineParser === 'function') {
      defineParser(Parsers);
    }
  }
});

function parse(source) {
  const ast = utils.markdownSourceToAST(source);
  const context = new Context(source, Parsers, {});

  return Parsers.ParameterParser.parse(ast, context)[1];
}

describe('ParameterParser', () => {
  it('parses parameter signature with name, example, type, type attributes and description', () => {
    const source = 'id: 42 (number, required) - user id';

    const result = parse(source);

    expect(result.name).toBe('id');
    expect(result.value).toBe('42');
    expect(result.type).toBe('number');
    expect(result.typeAttributes).toEqual(['required']);
    expect(result.description).toBe('user id');
  });

  it('throws an error if a parameter is specified as both required and optional', () => {
    const source = 'name: `John` (required, optional) - user name';

    expect(() => parse(source)).toThrow(utils.CrafterError);
  });
});
