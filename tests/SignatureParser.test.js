const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

describe('SignatureParser', () => {
  describe('Property signature', () => {
    it('Parses signature with name only', () => {
      const signature = new SignatureParser('name');
      expect(signature.name).toBe('name');
    });

    it('Parses signature with name and example', () => {
      const signature = new SignatureParser('name: `Example`');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
    });

    it('Parses signature with name and attributes', () => {
      const signature = new SignatureParser('name: (string, required)');
      expect(signature.name).toBe('name');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
    });

    it('Parses signature with name and description', () => {
      const signature = new SignatureParser('name - Description');
      expect(signature.name).toBe('name');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name, example and attributes', () => {
      const signature = new SignatureParser('name: `Example` (string, required)');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
    });

    it('Parses signature with name, example and description', () => {
      const signature = new SignatureParser('name: `Example` - Description');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name, attributes and description', () => {
      const signature = new SignatureParser('name: (string, required) - Description');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name, attributes, example and description', () => {
      const signature = new SignatureParser('name: `Example` (string, required) - Description');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name quoting', () => {
      const signature = new SignatureParser('`name`: `Example` - Description');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with unescaped example', () => {
      const signature = new SignatureParser('name: Example');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
    });

    it('Parses signature with extra spaces after name', () => {
      const signature = new SignatureParser('name     : `Example`');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
    });

    it('Parses signature with description delimeter inside description', () => {
      const signature = new SignatureParser('name - description - here');
      expect(signature.name).toBe('name');
      expect(signature.description).toBe('description - here');
    });

    it('Parses signature with no name', () => {
      const signature = new SignatureParser('(string)');
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with type, name, sample attribute and with no value', () => {
      const signature = new SignatureParser('name (string, sample)');
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(1);
      expect(signature.warnings[0]).toBe('no value present when "sample" is specified: "name (string, sample)"');
    });

    it('Parses signature with type and sample attribute only', () => {
      const signature = new SignatureParser('(string, sample)');
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(2);
    });

    it('Prefers default attribute over sample when both are specified', () => {
      const signature = new SignatureParser('name: John (string, default, sample)');
      expect(signature.isDefault).toBeTruthy();
      expect(signature.isSample).toBeFalsy();
      expect(signature.warnings[0]).toBe('Cannot use "default" and "sample" together.');
    });
  });

  describe('Element signature', () => {
    const traits = [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION];

    it('Parses signature with example, type and description', () => {
      const signature = new SignatureParser('`Example` (string) - Description', traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.type).toBe('string');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with example and type', () => {
      const signature = new SignatureParser('`Example` (string)', traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.type).toBe('string');
    });

    it('Parses signature with example and description', () => {
      const signature = new SignatureParser('`Example` - Description', traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with type and description', () => {
      const signature = new SignatureParser('(string) - Description', traits);
      expect(signature.type).toBe('string');
      expect(signature.description).toBe('Description');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with type only', () => {
      const signature = new SignatureParser('(number)', traits);
      expect(signature.type).toBe('number');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with description only', () => {
      const signature = new SignatureParser('- Description', traits);
      expect(signature.description).toBe('Description');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with example only', () => {
      const signature = new SignatureParser('`Example`', traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
    });

    it('Parses signature with an escaped empty string as value', () => {
      let signature = new SignatureParser('`` - empty string', traits);
      expect(signature.value).toBe('');
      expect(signature.rawValue).toBe('``');
      expect(signature.description).toBe('empty string');

      signature = new SignatureParser('``', traits);
      expect(signature.value).toBe('');
      expect(signature.rawValue).toBe('``');
    });
  });

  describe('Attributes signature', () => {
    const traits = [ParserTraits.NAME, ParserTraits.ATTRIBUTES];

    it('Parses simple attributes signature', () => {
      const signature = new SignatureParser('Attributes', traits);
      expect(signature.name).toBe('Attributes');
    });

    it('Parses typed attributes signature', () => {
      const signature = new SignatureParser('Attributes(User)', traits);
      expect(signature.name).toBe('Attributes');
      expect(signature.type).toBe('User');

      const signature2 = new SignatureParser('Attributes(array[boolean])', traits);
      expect(signature2.name).toBe('Attributes');
      expect(signature2.type).toBe('array[boolean]');

      const signature3 = new SignatureParser('Attributes (object)', traits);
      expect(signature3.name).toBe('Attributes');
      expect(signature3.type).toBe('object');
    });

    it('Parses type attributes on attributes section', () => {
      const signature1 = new SignatureParser('Attributes (fixed)', traits);
      expect(signature1.name).toBe('Attributes');
      expect(signature1.typeAttributes).toEqual(['fixed']);

      const signature2 = new SignatureParser('Attributes (object, fixed)', traits);
      expect(signature2.name).toBe('Attributes');
      expect(signature2.type).toBe('object');
      expect(signature2.typeAttributes).toEqual(['fixed']);
    });
  });

  describe('Named type signature', () => {
    const traits = [ParserTraits.NAME, ParserTraits.ATTRIBUTES];

    it('Parses simple named type signature', () => {
      const signature = new SignatureParser('User', traits);
      expect(signature.name).toBe('User');
    });

    it('Parses named type with a type section', () => {
      const signature = new SignatureParser('User (string)', traits);
      expect(signature.name).toBe('User');
      expect(signature.type).toBe('string');
    });

    it('Parses type attributes on named type', () => {
      const signature = new SignatureParser('User (fixed)', traits);
      expect(signature.name).toBe('User');
      expect(signature.typeAttributes).toEqual(['fixed']);
    });

    it('Parses type attributes on named type with a type section', () => {
      const signature = new SignatureParser('User (string, fixed)', traits);
      expect(signature.name).toBe('User');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['fixed']);
    });

    it('Splits multiline signature', () => {
      const signature = new SignatureParser('name: `Example` - Description\nBlockDescription1\nBlockDescription2');
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
      expect(signature.rest).toBe('BlockDescription1\nBlockDescription2');
    });
  });
});
