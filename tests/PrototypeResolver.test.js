const PrototypeResolver = require('../PrototypeResolver');
const ResourcePrototypeElement = require('../parsers/elements/ResourcePrototypeElement');
const ResponseElement = require('../parsers/elements/ResponseElement');

const CrafterError = require('../utils').CrafterError;

let resolver;
let foo;
let bar;

describe('TypeResolver', () => {
  beforeEach(() => {
    resolver = new PrototypeResolver();
    foo = new ResourcePrototypeElement('foo');
    bar = new ResourcePrototypeElement('bar', ['foo']);
  });

  it('resolves empty types array without errors', () => {
    resolver.resolveRegisteredPrototypes();
  });

  it('resolves base prototype', () => {
    foo.responses = [
      new ResponseElement(200),
    ];

    bar.responses = [
      new ResponseElement(404),
    ];

    resolver.prototypes = { foo, bar };

    resolver.resolveRegisteredPrototypes();

    expect(resolver.prototypes.bar.responses).toHaveLength(2);
    expect(resolver.prototypes.bar.responses[1]).toBe(foo.responses[0]);
  });

  it('throws error on unknown type', () => {
    foo.basePrototypes = ['unknown'];
    resolver.prototypes = { foo };
    expect(() => resolver.resolveRegisteredPrototypes()).toThrow(CrafterError);
  });

  it('throws error on loop', () => {
    foo.basePrototypes = ['bar'];
    resolver.prototypes = { foo, bar };
    expect(() => resolver.resolveRegisteredPrototypes()).toThrow(CrafterError);
  });

  it('resolves base prototypes recursively', () => {
    foo.responses = [
      new ResponseElement(200),
    ];

    bar.responses = [
      new ResponseElement(404),
    ];

    const baz = new ResourcePrototypeElement('baz', ['bar']);
    resolver.prototypes = { baz, foo, bar };

    resolver.resolveRegisteredPrototypes();

    expect(resolver.prototypes.bar.responses).toHaveLength(2);
    expect(resolver.prototypes.bar.responses[1]).toBe(foo.responses[0]);

    expect(resolver.prototypes.baz.responses).toHaveLength(2);
    expect(resolver.prototypes.baz.responses[0]).toBe(bar.responses[0]);
    expect(resolver.prototypes.baz.responses[1]).toBe(foo.responses[0]);
  });
});
