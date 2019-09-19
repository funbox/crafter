const TypeResolver = require('../TypeResolver');
const MSONNamedTypeElement = require('../parsers/elements/MSONNamedTypeElement');
const StringElement = require('../parsers/elements/StringElement');
const CrafterError = require('../utils').CrafterError;

let resolver;
let foo;
let bar;

describe('TypeResolver', () => {
  beforeEach(() => {
    resolver = new TypeResolver();
    foo = new MSONNamedTypeElement(new StringElement('foo'));
    bar = new MSONNamedTypeElement(new StringElement('bar'), 'foo');
  });

  it('resolves empty types array without errors', () => {
    resolver.resolveRegisteredTypes();
  });

  it('throws error on unknown type', () => {
    foo.content.type = 'unknown';
    resolver.types = { foo: foo.content };
    expect(() => resolver.resolveRegisteredTypes()).toThrow(CrafterError);
  });

  it('throws error on loop', () => {
    foo.content.type = 'bar';
    resolver.types = { foo: foo.content, bar: bar.content };
    resolver.typeNames = { foo: foo.name, bar: bar.name };
    expect(() => resolver.resolveRegisteredTypes()).toThrow(CrafterError);
  });
});
