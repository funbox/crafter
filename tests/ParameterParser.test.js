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
    expect(name).toBe('id');
    expect(value).toBe('42');
    expect(type).toBe('number');
    expect(typeAttributes).toEqual(['required']);
    expect(description).toEqual({
      string: 'user id',
      sourceMap: {
        byteBlocks: [
          {
            offset: 0,
            length: 35,
          },
        ],
        charBlocks: [
          {
            offset: 0,
            length: 35,
            startLine: 0,
            startColumn: 1,
            endLine: 0,
            endColumn: 35,
          },
        ],
      },
    });
  });

  it('throws an error if a parameter is specified as both required and optional', () => {
    const source = 'name: `John` (required, optional) - user name';

    expect(() => parse(source)).toThrow(utils.CrafterError);
  });

  it('parses required parameter with default value, creates warnings via logger', () => {
    const source = 'name: `John` (string, required) - user name\n+ Default: `Ivan`\n';

    const {
      result: { name, value, type, typeAttributes, description, defaultValue },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(1);
    expect(name).toBe('name');
    expect(value).toBe('John');
    expect(type).toBe('string');
    expect(typeAttributes).toEqual(['required']);
    expect(description).toEqual({
      string: 'user name',
      sourceMap: {
        byteBlocks: [
          {
            offset: 0,
            length: 44,
          },
        ],
        charBlocks: [
          {
            offset: 0,
            length: 44,
            startLine: 1,
            startColumn: 1,
            endLine: 1,
            endColumn: 44,
          },
        ],
      },
    });
    expect(defaultValue).toEqual({
      values: [
        'Ivan',
      ],
      type: 'string',
      sourceMap: {
        byteBlocks: [
          {
            offset: 46,
            length: 16,
          },
        ],
        charBlocks: [
          {
            offset: 46,
            length: 16,
            startLine: 2,
            startColumn: 3,
            endLine: 2,
            endColumn: 18,
          },
        ],
      },
      content: 'Ivan',
      valuesForBody: null,
    });
  });
});
