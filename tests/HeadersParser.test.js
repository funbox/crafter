const Context = require('../Context');
const defineParser = require('../parsers/HeadersParser');
const utils = require('../utils');
const SourceMapElement = require('../parsers/elements/SourceMapElement');

const Parsers = {};
defineParser(Parsers);

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
  const result = Parsers.HeadersParser.parse(ast, context)[1];

  return { result, warnings };
}

describe('HeadersParser', () => {
  it('parses correct (Key: Value) headers', () => {
    const source = `Headers

    Accept-Charset: utf-8
    Connection: keep-alive
    Content-Type: multipart/form-data, boundary=AaB03x

`;

    const { result: { headers }, warnings } = parse(source);

    expect(warnings.length).toBe(0);
    expect(headers).toEqual([
      {
        key: 'Accept-Charset',
        val: 'utf-8',
        sourceMap: new SourceMapElement([{ offset: 13, length: 21 }]),
      },
      {
        key: 'Connection',
        val: 'keep-alive',
        sourceMap: new SourceMapElement([{ offset: 39, length: 22 }]),
      },
      {
        key: 'Content-Type',
        val: 'multipart/form-data, boundary=AaB03x',
        sourceMap: new SourceMapElement([{ offset: 66, length: 50 }]),
      },
    ]);
  });

  it('parses headers with colons in values', () => {
    const source = `Headers

    Accept-Charset: utf:8
    Connection: keep:alive
    Content-Type: multipart:form-data, boundary=AaB03x

`;

    const { result: { headers }, warnings } = parse(source);

    expect(warnings.length).toBe(0);
    expect(headers).toEqual([
      {
        key: 'Accept-Charset',
        val: 'utf:8',
        sourceMap: new SourceMapElement([{ offset: 13, length: 21 }]),
      },
      {
        key: 'Connection',
        val: 'keep:alive',
        sourceMap: new SourceMapElement([{ offset: 39, length: 22 }]),
      },
      {
        key: 'Content-Type',
        val: 'multipart:form-data, boundary=AaB03x',
        sourceMap: new SourceMapElement([{ offset: 66, length: 50 }]),
      },
    ]);
  });

  it('parses headers, ignoring incorrect lines, creates warnings via logger', () => {
    const source = `Headers

    Accept-Charset - utf-8
    Connection: keep-alive
    Content-Type multipart/form-data, boundary=AaB03x

`;

    const { result: { headers }, warnings } = parse(source);

    expect(warnings.length).toBe(2);
    expect(headers).toEqual([
      {
        key: 'Connection',
        val: 'keep-alive',
        sourceMap: new SourceMapElement([{ offset: 40, length: 22 }]),
      },
    ]);
  });
});
