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
  const result = Parsers.MSONAttributeParser.parse(ast, context)[1];

  return { result, warnings };
}

describe('MSONAttributeParser', () => {
  it('parses enum with members', () => {
    const source = `kind (enum)
+ movement - описание 1
+ track - описание 2
+ sms - описание 3
+ zone - описание 4
`;

    const { result: { name, value: { type, content } }, warnings } = parse(source);

    expect(warnings.length).toBe(0);
    expect(name.string).toBe('kind');
    expect(type).toBe('enum');
    expect(content.members).toEqual([
      {
        value: 'movement',
        description: 'описание 1',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 12,
              length: 32,
            },
          ],
          charBlocks: [
            {
              offset: 12,
              length: 24,
              startLine: 2,
              startColumn: 1,
              endLine: 2,
              endColumn: 24,
            },
          ],
        },
      },
      {
        value: 'track',
        description: 'описание 2',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 44,
              length: 29,
            },
          ],
          charBlocks: [
            {
              offset: 36,
              length: 21,
              startLine: 3,
              startColumn: 1,
              endLine: 3,
              endColumn: 21,
            },
          ],
        },
      },
      {
        value: 'sms',
        description: 'описание 3',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 73,
              length: 27,
            },
          ],
          charBlocks: [
            {
              offset: 57,
              length: 19,
              startLine: 4,
              startColumn: 1,
              endLine: 4,
              endColumn: 19,
            },
          ],
        },
      },
      {
        value: 'zone',
        description: 'описание 4',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 100,
              length: 28,
            },
          ],
          charBlocks: [
            {
              offset: 76,
              length: 20,
              startLine: 5,
              startColumn: 1,
              endLine: 5,
              endColumn: 20,
            },
          ],
        },
      },
    ]);
  });

  it('parses enum with default, sample and members', () => {
    const source = `kind (enum)
+ Default: track
+ Sample: sms
+ movement - описание 1
+ track - описание 2
+ sms - описание 3
+ zone - описание 4
`;

    const {
      result: { name, value: { type, content: { defaultValue, sampleValues, members } } },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(0);
    expect(name.string).toBe('kind');
    expect(type).toBe('enum');
    expect(defaultValue).toEqual({
      value: 'track',
      type: 'string',
      sourceMap: {
        byteBlocks: [
          {
            offset: 23,
            length: 5,
          },
        ],
        charBlocks: [
          {
            offset: 23,
            length: 5,
            startLine: 2,
            startColumn: 12,
            endLine: 2,
            endColumn: 16,
          },
        ],
        file: undefined,
      },
    });
    expect(sampleValues).toEqual([
      {
        value: 'sms',
        type: 'string',
        sourceMap: {
          byteBlocks: [{
            length: 3,
            offset: 39,
          }],
          charBlocks: [{
            offset: 39,
            length: 3,
            startLine: 3,
            startColumn: 11,
            endLine: 3,
            endColumn: 13,
          }],
          file: undefined,
        },
      },
    ]);

    expect(members).toEqual([
      {
        value: 'movement',
        description: 'описание 1',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 43,
              length: 32,
            },
          ],
          charBlocks: [
            {
              offset: 43,
              length: 24,
              startLine: 4,
              startColumn: 1,
              endLine: 4,
              endColumn: 24,
            },
          ],
        },
      },
      {
        value: 'track',
        description: 'описание 2',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 75,
              length: 29,
            },
          ],
          charBlocks: [
            {
              offset: 67,
              length: 21,
              startLine: 5,
              startColumn: 1,
              endLine: 5,
              endColumn: 21,
            },
          ],
        },
      },
      {
        value: 'sms',
        description: 'описание 3',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 104,
              length: 27,
            },
          ],
          charBlocks: [
            {
              offset: 88,
              length: 19,
              startLine: 6,
              startColumn: 1,
              endLine: 6,
              endColumn: 19,
            },
          ],
        },
      },
      {
        value: 'zone',
        description: 'описание 4',
        type: 'string',
        sourceMap: {
          byteBlocks: [
            {
              offset: 131,
              length: 28,
            },
          ],
          charBlocks: [
            {
              offset: 107,
              length: 20,
              startLine: 7,
              startColumn: 1,
              endLine: 7,
              endColumn: 20,
            },
          ],
        },
      },
    ]);
  });

  it('parses enum with no members, default or sample, creates warnings via logger', () => {
    const source = 'kind (enum)';

    const { result: { name, value: { type, content } }, warnings } = parse(source);

    expect(warnings.length).toBe(1);
    expect(name.string).toBe('kind');
    expect(type).toBe('enum');
    expect(content).toBeNull();
  });

  it('parses enum with sample but no members, creates warnings via logger', () => {
    const source = 'kind (enum)\n+ Sample: track\n';

    const {
      result: { name, value: { type, content: { sampleValues, members } } },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(1);
    expect(name.string).toBe('kind');
    expect(type).toBe('enum');
    expect(sampleValues).toEqual([{
      value: 'track',
      type: 'string',
      sourceMap: {
        byteBlocks: [{
          length: 5,
          offset: 22,
        }],
        charBlocks: [{
          endColumn: 15,
          endLine: 2,
          length: 5,
          offset: 22,
          startColumn: 11,
          startLine: 2,
        }],
        file: undefined,
      },
    }]);
    expect(members).toEqual([]);
  });
});
