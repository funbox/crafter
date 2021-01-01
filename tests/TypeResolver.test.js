const TypeResolver = require('../TypeResolver');
const MSONNamedTypeElement = require('../parsers/elements/MSONNamedTypeElement');
const ValueMemberElement = require('../parsers/elements/ValueMemberElement');
const StringElement = require('../parsers/elements/StringElement');
const CrafterError = require('../utils').CrafterError;

let resolver;
let foo;
let bar;

describe('TypeResolver', () => {
  beforeEach(() => {
    resolver = new TypeResolver();
    foo = new MSONNamedTypeElement(new StringElement('foo'), new ValueMemberElement());
    bar = new MSONNamedTypeElement(new StringElement('bar'), new ValueMemberElement('foo'));
  });

  it('checks empty types array without errors', () => {
    resolver.checkRegisteredTypes();
  });

  it('throws error on unknown type', () => {
    foo.content.type = 'unknown';
    resolver.registerType(foo, foo.content);
    expect(() => resolver.checkRegisteredTypes()).toThrow(CrafterError);
  });

  it('throws error on loop', () => {
    foo.content.type = 'bar';
    foo.content.typeAttributes = ['required'];
    resolver.registerType(foo, foo.content);
    resolver.registerType(bar, bar.content);
    expect(() => resolver.checkRegisteredTypes()).toThrow(CrafterError);
  });
});
