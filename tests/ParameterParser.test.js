const fs = require('fs');
const Context = require('../Context');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');

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
  const warnings = [];
  const ast = utils.markdownSourceToAST(source);
  const context = new Context(source, Parsers, {
    logger: {
      warn(text) {
        warnings.push(text);
      },
    },
  });
  const result = Parsers.ParameterParser.parse(ast, context)[1];

  return { result, warnings };
}

describe('ParameterParser', () => {
  it('parses parameter signature with name, example, type, type attributes and description', () => {
    const source = 'id: 42 (number, required) - user id';

    const {
      result: { name, value, type, typeAttributes, description },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(0);
    expect(name.string).toBe('id');
    expect(value.string).toBe('42');
    expect(type).toBe('number');
    expect(typeAttributes.map(attr => attr.string)).toEqual(['required']);
    expect(description).toEqual({
      string: 'user id',
      sourceMap: {
        byteBlocks: [
          {
            offset: 28,
            length: 7,
          },
        ],
        charBlocks: [
          {
            offset: 28,
            length: 7,
            startLine: 1,
            startColumn: 29,
            endLine: 1,
            endColumn: 35,
          },
        ],
      },
    });
  });

  it('throws an error if a parameter is specified as both required and optional', () => {
    const source = 'name: `John` (required, optional) - user name';

    expect(() => parse(source)).toThrow(utilsHelpers.CrafterError);
  });

  it('parses required parameter with default value, creates warnings via logger', () => {
    const source = 'name: `John` (string, required) - user name\n+ Default: `Ivan`\n';

    const {
      result: { name, value, type, typeAttributes, description, defaultValue },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(1);
    expect(name.string).toBe('name');
    expect(value.string).toBe('John');
    expect(type).toBe('string');
    expect(typeAttributes.map(attr => attr.string)).toEqual(['required']);
    expect(description).toEqual({
      string: 'user name',
      sourceMap: {
        byteBlocks: [
          {
            offset: 34,
            length: 9,
          },
        ],
        charBlocks: [
          {
            offset: 34,
            length: 9,
            startLine: 1,
            startColumn: 35,
            endLine: 1,
            endColumn: 43,
          },
        ],
      },
    });
    expect(defaultValue).toEqual({
      sourceMap: {
        byteBlocks: [{
          length: 4,
          offset: 56,
        }],
        charBlocks: [{
          offset: 56,
          length: 4,
          startLine: 2,
          startColumn: 13,
          endLine: 2,
          endColumn: 16,
        }],
        file: undefined,
      },
      type: 'string',
      value: 'Ivan',
    });
  });
});
