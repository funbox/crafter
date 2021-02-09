const Context = require('../Context');
const defineParser = require('../parsers/HeadersParser');
const utilsHelpers = require('../utils/index');

const Parsers = {};
defineParser(Parsers);

function parse(source) {
  const warnings = [];
  const ast = utilsHelpers.markdownSourceToAST(source);
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
        sourceMap: {
          byteBlocks: [
            {
              offset: 13,
              length: 21,
            },
          ],
          charBlocks: [
            {
              offset: 13,
              length: 21,
              startLine: 3,
              startColumn: 5,
              endLine: 3,
              endColumn: 25,
            },
          ],
        },
      },
      {
        key: 'Connection',
        val: 'keep-alive',
        sourceMap: {
          byteBlocks: [
            {
              offset: 39,
              length: 22,
            },
          ],
          charBlocks: [
            {
              offset: 39,
              length: 22,
              startLine: 4,
              startColumn: 5,
              endLine: 4,
              endColumn: 26,
            },
          ],
        },
      },
      {
        key: 'Content-Type',
        val: 'multipart/form-data, boundary=AaB03x',
        sourceMap: {
          byteBlocks: [
            {
              offset: 66,
              length: 50,
            },
          ],
          charBlocks: [
            {
              offset: 66,
              length: 50,
              startLine: 5,
              startColumn: 5,
              endLine: 5,
              endColumn: 54,
            },
          ],
        },
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
        sourceMap: {
          byteBlocks: [
            {
              offset: 13,
              length: 21,
            },
          ],
          charBlocks: [
            {
              offset: 13,
              length: 21,
              startLine: 3,
              startColumn: 5,
              endLine: 3,
              endColumn: 25,
            },
          ],
        },
      },
      {
        key: 'Connection',
        val: 'keep:alive',
        sourceMap: {
          byteBlocks: [
            {
              offset: 39,
              length: 22,
            },
          ],
          charBlocks: [
            {
              offset: 39,
              length: 22,
              startLine: 4,
              startColumn: 5,
              endLine: 4,
              endColumn: 26,
            },
          ],
        },
      },
      {
        key: 'Content-Type',
        val: 'multipart:form-data, boundary=AaB03x',
        sourceMap: {
          byteBlocks: [
            {
              offset: 66,
              length: 50,
            },
          ],
          charBlocks: [
            {
              offset: 66,
              length: 50,
              startLine: 5,
              startColumn: 5,
              endLine: 5,
              endColumn: 54,
            },
          ],
        },
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
        sourceMap: {
          byteBlocks: [
            {
              offset: 40,
              length: 22,
            },
          ],
          charBlocks: [
            {
              offset: 40,
              length: 22,
              startLine: 4,
              startColumn: 5,
              endLine: 4,
              endColumn: 26,
            },
          ],
        },
      },
    ]);
  });
});
