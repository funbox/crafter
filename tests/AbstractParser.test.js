const Context = require('../Context');
const utils = require('../utils');
const AbstractParser = require('../parsers/AbstractParser');

describe('ActionParser', () => {
  it('Cannot be used as a standalone parser', () => {
    const source = '# My API\n\n## List users [GET /users]\n\n+ Response 200';
    const ast = utils.markdownSourceToAST(source);
    const context = new Context(source, {}, {});
    expect(() => {
      AbstractParser.parse(ast.firstChild, context);
    }).toThrowError('Not Implemented');
  });

  it('Defines itself as an undefined section', () => {
    const source = '# My API\n\n## List users [GET /users]\n\n+ Response 200';
    const ast = utils.markdownSourceToAST(source);
    const context = new Context(source, {}, {});
    const sectionType = AbstractParser.sectionType(ast.firstChild, context);
    const nestedSectionType = AbstractParser.nestedSectionType(ast.firstChild, context);
    const upperSectionType = AbstractParser.upperSectionType(ast.firstChild, context);
    expect(sectionType).toBe('undefined');
    expect(nestedSectionType).toBe('undefined');
    expect(upperSectionType).toBe('undefined');
  });
});
