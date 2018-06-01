const TypeResolver = require('../TypeResolver');
const MSONNamedTypeElement = require('../parsers/elements/MSONNamedTypeElement');
const MSONAttributeElement = require('../parsers/elements/MSONAttributeElement');
const CrafterError = require('../utils').CrafterError;

let resolver;
let foo;
let bar;

describe('TypeResolver', () => {
  beforeEach(() => {
    resolver = new TypeResolver();
    foo = new MSONNamedTypeElement('foo');
    bar = new MSONNamedTypeElement('bar', 'foo');
  });

  it('resolves empty types array without errors', () => {
    resolver.resolveRegisteredTypes();
  });

  it('resolves base type', () => {
    foo.content = [
      new MSONAttributeElement('a')
    ];

    bar.content = [
      new MSONAttributeElement('b')
    ];
    resolver.types = {foo, bar};

    resolver.resolveRegisteredTypes();

    expect(resolver.types.bar.content.length).toEqual(2);
    expect(resolver.types.bar.content[1]).toBe(foo.content[0]);
  });

  it('resolves base type recursively', () => {
    foo.content = [
      new MSONAttributeElement('a')
    ];

    bar.content = [
      new MSONAttributeElement('b')
    ];

    const baz = new MSONNamedTypeElement('baz', 'bar');
    resolver.types = {baz, foo, bar};

    resolver.resolveRegisteredTypes();

    expect(resolver.types.bar.content.length).toEqual(2);
    expect(resolver.types.bar.content[1]).toBe(foo.content[0]);

    expect(resolver.types.baz.content.length).toEqual(2);
    expect(resolver.types.baz.content[0]).toBe(bar.content[0]);
    expect(resolver.types.baz.content[1]).toBe(foo.content[0]);
  });

  it('throws error on unknown type', () => {
    foo.baseType = 'unknown';
    resolver.types = {foo};
    expect(() => resolver.resolveRegisteredTypes()).toThrow(CrafterError);
  });

  it('throws error on loop', () => {
    foo.baseType = 'bar';
    resolver.types = {foo, bar};
    expect(() => resolver.resolveRegisteredTypes()).toThrow(CrafterError);
  });
});