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
  const result = Parsers.ActionParser.parse(ast.firstChild, context)[1];

  return { result, warnings };
}

describe('ActionParser', () => {
  it('parsers a named action', () => {
    const source = 'List users [GET /users]\n\n+ Response 200';

    const { result: { title, method, href, responses }, warnings } = parse(source);

    expect(warnings.length).toBe(0);
    expect(title).toBe('List users');
    expect(method).toBe('GET');
    expect(href).toBe('/users');
    expect(responses[0].statusCode).toBe('200');
  });

  it('parsers an action with href variables', () => {
    const source = `List users [GET /users/{id}]

+ Parameters
    + id: 42 (number, required) - user id

+ Response 200
`;

    const { result: { title, method, href, parameters, responses }, warnings } = parse(source);

    expect(warnings.length).toBe(0);
    expect(title).toBe('List users');
    expect(method).toBe('GET');
    expect(href).toBe('/users/{id}');
    expect(parameters.parameters[0].name).toBe('id');
    expect(responses[0].statusCode).toBe('200');
  });

  it('parses an action with a missing parameter, creates warnings via logger', () => {
    const source = `List users [GET /users/{id}{?name}]

+ Parameters
    + id: 42 (number, required) - user id

+ Response 200
`;

    const { result: { title, method, href, parameters, responses }, warnings } = parse(source);

    expect(warnings.length).toBe(1);
    expect(title).toBe('List users');
    expect(method).toBe('GET');
    expect(href).toBe('/users/{id}{?name}');
    expect(parameters.parameters[0].name).toBe('id');
    expect(responses[0].statusCode).toBe('200');
  });
});
