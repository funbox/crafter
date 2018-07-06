const TypeResolver = require('../TypeResolver');
const MSONNamedTypeElement = require('../parsers/elements/MSONNamedTypeElement');
const PropertyMemberElement = require('../parsers/elements/PropertyMemberElement');
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
    foo.content.propertyMembers = [
      new PropertyMemberElement('a'),
    ];

    bar.content.propertyMembers = [
      new PropertyMemberElement('b'),
    ];
    resolver.types = { foo: foo.content, bar: bar.content };

    resolver.resolveRegisteredTypes();

    expect(resolver.types.bar.propertyMembers.length).toEqual(2);
    expect(resolver.types.bar.propertyMembers[1]).toBe(foo.content.propertyMembers[0]);
  });

  it('resolves base type recursively', () => {
    foo.content.propertyMembers = [
      new PropertyMemberElement('a'),
    ];

    bar.content.propertyMembers = [
      new PropertyMemberElement('b'),
    ];

    const baz = new MSONNamedTypeElement('baz', 'bar');
    resolver.types = { baz: baz.content, foo: foo.content, bar: bar.content };

    resolver.resolveRegisteredTypes();

    expect(resolver.types.bar.propertyMembers.length).toEqual(2);
    expect(resolver.types.bar.propertyMembers[1]).toBe(foo.content.propertyMembers[0]);

    expect(resolver.types.baz.propertyMembers.length).toEqual(2);
    expect(resolver.types.baz.propertyMembers[0]).toBe(bar.content.propertyMembers[0]);
    expect(resolver.types.baz.propertyMembers[1]).toBe(foo.content.propertyMembers[0]);
  });

  it('throws error on unknown type', () => {
    foo.content.type = 'unknown';
    resolver.types = { foo: foo.content };
    expect(() => resolver.resolveRegisteredTypes()).toThrow(CrafterError);
  });

  it('throws error on loop', () => {
    foo.content.type = 'bar';
    resolver.types = { foo: foo.content, bar: bar.content };
    expect(() => resolver.resolveRegisteredTypes()).toThrow(CrafterError);
  });
});
