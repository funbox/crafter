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
    expect(name).toBe('kind');
    expect(type).toBe('enum');
    expect(content.members).toEqual([
      { name: 'movement', description: 'описание 1', type: 'string' },
      { name: 'track', description: 'описание 2', type: 'string' },
      { name: 'sms', description: 'описание 3', type: 'string' },
      { name: 'zone', description: 'описание 4', type: 'string' },
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
      result: { name, value: { type, content: { defaultValue, sampleValue, members } } },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(0);
    expect(name).toBe('kind');
    expect(type).toBe('enum');
    expect(defaultValue).toEqual({ value: 'track' });
    expect(sampleValue).toEqual({ type: 'string', members: ['sms'] });
    expect(members).toEqual([
      { name: 'movement', description: 'описание 1', type: 'string' },
      { name: 'track', description: 'описание 2', type: 'string' },
      { name: 'sms', description: 'описание 3', type: 'string' },
      { name: 'zone', description: 'описание 4', type: 'string' },
    ]);
  });

  it('parses enum with no members, default or sample, creates warnings via logger', () => {
    const source = 'kind (enum)';

    const { result: { name, value: { type, content } }, warnings } = parse(source);

    expect(warnings.length).toBe(1);
    expect(name).toBe('kind');
    expect(type).toBe('enum');
    expect(content).toBeNull();
  });

  it('parses enum with sample but no members, creates warnings via logger', () => {
    const source = 'kind (enum)\n+ Sample: track\n';

    const {
      result: { name, value: { type, content: { sampleValue, members } } },
      warnings,
    } = parse(source);

    expect(warnings.length).toBe(1);
    expect(name).toBe('kind');
    expect(type).toBe('enum');
    expect(sampleValue).toEqual({ type: 'string', members: ['track'] });
    expect(members).toEqual([]);
  });
});
