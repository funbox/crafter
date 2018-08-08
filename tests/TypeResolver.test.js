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
    foo.content.content = {
      propertyMembers: [
        new PropertyMemberElement('a'),
      ],
    };

    bar.content.content = {
      propertyMembers: [
        new PropertyMemberElement('b'),
      ],
    };
    resolver.types = { foo: foo.content, bar: bar.content };

    resolver.resolveRegisteredTypes();

    expect(resolver.types.bar.content.propertyMembers.length).toEqual(2);
    expect(resolver.types.bar.content.propertyMembers[1]).toBe(foo.content.content.propertyMembers[0]);
  });

  it('resolves base type recursively', () => {
    foo.content.content = {
      propertyMembers: [
        new PropertyMemberElement('a'),
      ],
    };

    bar.content.content = {
      propertyMembers: [
        new PropertyMemberElement('b'),
      ],
    };

    const baz = new MSONNamedTypeElement('baz', 'bar');
    baz.content.content = {
      propertyMembers: [],
    };
    resolver.types = { baz: baz.content, foo: foo.content, bar: bar.content };

    resolver.resolveRegisteredTypes();

    expect(resolver.types.bar.content.propertyMembers.length).toEqual(2);
    expect(resolver.types.bar.content.propertyMembers[1]).toBe(foo.content.content.propertyMembers[0]);

    expect(resolver.types.baz.content.propertyMembers.length).toEqual(2);
    expect(resolver.types.baz.content.propertyMembers[0]).toBe(bar.content.content.propertyMembers[0]);
    expect(resolver.types.baz.content.propertyMembers[1]).toBe(foo.content.content.propertyMembers[0]);
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
