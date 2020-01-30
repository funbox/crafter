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
              offset: 14,
              length: 30,
            },
          ],
          charBlocks: [
            {
              offset: 14,
              length: 22,
              startLine: 2,
              startColumn: 3,
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
              offset: 46,
              length: 27,
            },
          ],
          charBlocks: [
            {
              offset: 38,
              length: 19,
              startLine: 3,
              startColumn: 3,
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
              offset: 75,
              length: 25,
            },
          ],
          charBlocks: [
            {
              offset: 59,
              length: 17,
              startLine: 4,
              startColumn: 3,
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
              offset: 102,
              length: 26,
            },
          ],
          charBlocks: [
            {
              offset: 78,
              length: 18,
              startLine: 5,
              startColumn: 3,
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
            offset: 14,
            length: 15,
          },
        ],
        charBlocks: [
          {
            offset: 14,
            length: 15,
            startLine: 2,
            startColumn: 3,
            endLine: 2,
            endColumn: 17,
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
            length: 12,
            offset: 31,
          }],
          charBlocks: [{
            offset: 31,
            length: 12,
            startLine: 3,
            startColumn: 3,
            endLine: 3,
            endColumn: 14,
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
              offset: 45,
              length: 30,
            },
          ],
          charBlocks: [
            {
              offset: 45,
              length: 22,
              startLine: 4,
              startColumn: 3,
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
              offset: 77,
              length: 27,
            },
          ],
          charBlocks: [
            {
              offset: 69,
              length: 19,
              startLine: 5,
              startColumn: 3,
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
              offset: 106,
              length: 25,
            },
          ],
          charBlocks: [
            {
              offset: 90,
              length: 17,
              startLine: 6,
              startColumn: 3,
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
              offset: 133,
              length: 26,
            },
          ],
          charBlocks: [
            {
              offset: 109,
              length: 18,
              startLine: 7,
              startColumn: 3,
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
          length: 14,
          offset: 14,
        }],
        charBlocks: [{
          endColumn: 16,
          endLine: 2,
          length: 14,
          offset: 14,
          startColumn: 3,
          startLine: 2,
        }],
        file: undefined,
      },
    }]);
    expect(members).toEqual([]);
  });
});
