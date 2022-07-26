const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

describe('SignatureParser', () => {
  describe('Property signature', () => {
    it('Parses signature with name only', () => {
      const signature = new SignatureParser('name', false);
      expect(signature.name).toBe('name');
    });

    it('Parses signature with name and example', () => {
      const signature = new SignatureParser('name: `Example`', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
    });

    it('Parses signature with name and attributes', () => {
      const signature = new SignatureParser('name: (string, required)', false);
      expect(signature.name).toBe('name');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with name and description', () => {
      const signature = new SignatureParser('name - Description', false);
      expect(signature.name).toBe('name');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name, example and attributes', () => {
      const signature = new SignatureParser('name: `Example` (string, required)', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
    });

    it('Parses signature with name, example and description', () => {
      const signature = new SignatureParser('name: `Example` - Description', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name, attributes and description', () => {
      const signature = new SignatureParser('name: (string, required) - Description', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe(null);
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
      expect(signature.description).toBe('Description');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with name, attributes, example and description', () => {
      const signature = new SignatureParser('name: `Example` (string, required) - Description', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required']);
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with name quoting', () => {
      const signature = new SignatureParser('`name`: `Example` - Description', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with empty quoted name', () => {
      const signature = new SignatureParser('``: Example (string)', false);
      expect(signature.name).toBe('');
      expect(signature.value).toBe('Example');
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(1);
      expect(signature.warnings[0]).toBe('No name specified: "``: Example (string)"');
    });

    it('Parses signature with unescaped example', () => {
      const signature = new SignatureParser('name: Example', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
    });

    it('Parses signature with extra spaces after name', () => {
      const signature = new SignatureParser('name     : `Example`', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
    });

    it('Parses signature with description delimiter inside description', () => {
      const signature = new SignatureParser('name - description - here', false);
      expect(signature.name).toBe('name');
      expect(signature.description).toBe('description - here');
    });

    it('Parses signature with no name', () => {
      const signature = new SignatureParser('(string)', false);
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with type, name, sample attribute and with no value', () => {
      const signature = new SignatureParser('name (string, sample)', false);
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(1);
      expect(signature.warnings[0]).toBe('no value present when "sample" is specified: "name (string, sample)"');
    });

    it('Parses signature with type and sample attribute only', () => {
      const signature = new SignatureParser('(string, sample)', false);
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(2);
    });

    it('Prefers default attribute over sample when both are specified', () => {
      const signature = new SignatureParser('name: John (string, default, sample)', false);
      expect(signature.isDefault).toBeTruthy();
      expect(signature.isSample).toBeFalsy();
      expect(signature.warnings[0]).toBe('Cannot use "default" and "sample" together.');
    });

    it('Parses signature with name and type section, but without value delimiter', () => {
      const signature = new SignatureParser('name (string)', false);
      expect(signature.name).toBe('name');
      expect(signature.type).toBe('string');
      expect(signature.warnings.length).toBe(0);
    });

    it('Parses signature with "pattern" parameterized type attribute', () => {
      const signature = new SignatureParser('(pattern="")');
      expect(signature.typeAttributes).toEqual([['pattern', '']]);
    });

    it('Parses signature when "pattern" type attribute has a complex regex value', () => {
      const signature = new SignatureParser('(string, pattern="(V|W)[0-9]{1,2} - [a-z]{, 6}")', false);
      expect(signature.typeAttributes).toEqual([
        ['pattern', '(V|W)[0-9]{1,2} - [a-z]{, 6}'],
      ]);
    });

    it('Parses signature with "format" parameterized type attribute', () => {
      const signature = new SignatureParser('(format="date-time")', false);
      expect(signature.typeAttributes).toEqual([['format', 'date-time']]);
    });

    it('Parses signature with name, value, description, static and parameterized type attributes', () => {
      const signature = new SignatureParser('name: `John` (string, pattern="[a-zа-я]", required) - user name', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('John');
      expect(signature.description).toBe('user name');
      expect(signature.type).toEqual('string');
      expect(signature.typeAttributes).toEqual([['pattern', '[a-zа-я]'], 'required']);
    });

    it('Parses signature with markdown in description', () => {
      const signature1 = new SignatureParser('name (string, required) - Example of **bold text** (asterisks)', false);
      expect(signature1.description).toBe('Example of **bold text** (asterisks)');

      const signature11 = new SignatureParser('name (string, required) - Example of __bold text__ (underscores)', false);
      expect(signature11.description).toBe('Example of __bold text__ (underscores)');

      const signature2 = new SignatureParser('name (string, required) - Example of *italic text* (asterisks)', false);
      expect(signature2.description).toBe('Example of *italic text* (asterisks)');

      const signature22 = new SignatureParser('name (string, required) - Example of _italic text_ (underscores)', false);
      expect(signature22.description).toBe('Example of _italic text_ (underscores)');

      const signature3 = new SignatureParser('name (string, required) - Example of ~~strikethrough~~', false);
      expect(signature3.description).toBe('Example of ~~strikethrough~~');

      const signature4 = new SignatureParser('name (string, required) - Example of `inline code`', false);
      expect(signature4.description).toBe('Example of `inline code`');

      const signature5 = new SignatureParser('name (string, required) - Example of [link text](https://example.com/)', false);
      expect(signature5.description).toBe('Example of [link text](https://example.com/)');
    });

    it('Warns about duplicating type attribute', () => {
      const signature = new SignatureParser('name (string, required, required)', false);
      expect(signature.name).toBe('name');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['required', 'required']);
      expect(signature.warnings).toHaveLength(1);
      expect(signature.warnings[0]).toBe('Attribute required has been defined more than once.');
    });

    it('Warns about duplicating parametrized attribute', () => {
      const signature = new SignatureParser('name (string, pattern="[a-zа-я]", pattern="[a-zа-я]")', false);
      expect(signature.name).toBe('name');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual([['pattern', '[a-zа-я]'], ['pattern', '[a-zа-я]']]);
      expect(signature.warnings).toHaveLength(1);
      expect(signature.warnings[0]).toBe('Attribute pattern has been defined more than once.');
    });

    it('Raises an error if a value of wrong type is used in parametrized attribute', () => {
      expect(() => {
        new SignatureParser('name (string, min-length=false)', false); // eslint-disable-line no-new
      }).toThrowError('Invalid signature: false is not a number');
      expect(() => {
        new SignatureParser('days (array, max-length=test)', false); // eslint-disable-line no-new
      }).toThrowError('Invalid signature: test is not a number');
      expect(() => {
        new SignatureParser('age (array, minimum=true)', false); // eslint-disable-line no-new
      }).toThrowError('Invalid signature: true is not a number');
    });

    it('Allows to use wrong parameter type language server mode', () => {
      expect(() => {
        new SignatureParser('name (string, min-length=false)', true); // eslint-disable-line no-new
      }).not.toThrowError();
      expect(() => {
        new SignatureParser('days (array, max-length=test)', true); // eslint-disable-line no-new
      }).not.toThrowError();
      expect(() => {
        new SignatureParser('age (array, minimum=true)', true); // eslint-disable-line no-new
      }).not.toThrowError();
    });
  });

  describe('Element signature', () => {
    const traits = [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION];

    it('Parses signature with example, type and description', () => {
      const signature = new SignatureParser('`Example` (string) - Description', false, traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.type).toBe('string');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with example and type', () => {
      const signature = new SignatureParser('`Example` (string)', false, traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.type).toBe('string');
    });

    it('Parses signature with example and description', () => {
      const signature = new SignatureParser('`Example` - Description', false, traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with type and description', () => {
      const signature = new SignatureParser('(string) - Description', false, traits);
      expect(signature.type).toBe('string');
      expect(signature.description).toBe('Description');
    });

    it('Parses signature with markdown in description', () => {
      const signature1 = new SignatureParser('(string) - Example of **bold text** (asterisks)', false, traits);
      expect(signature1.description).toBe('Example of **bold text** (asterisks)');

      const signature11 = new SignatureParser('(string) - Example of __bold text__ (underscores)', false, traits);
      expect(signature11.description).toBe('Example of __bold text__ (underscores)');

      const signature2 = new SignatureParser('(string) - Example of *italic text* (asterisks)', false, traits);
      expect(signature2.description).toBe('Example of *italic text* (asterisks)');

      const signature22 = new SignatureParser('(string) - Example of _italic text_ (underscores)', false, traits);
      expect(signature22.description).toBe('Example of _italic text_ (underscores)');

      const signature3 = new SignatureParser('(string) - Example of ~~strikethrough~~', false, traits);
      expect(signature3.description).toBe('Example of ~~strikethrough~~');

      const signature4 = new SignatureParser('`Test` (string) - Example of `inline code`', false, traits);
      expect(signature4.description).toBe('Example of `inline code`');

      const signature5 = new SignatureParser('(string) - Example of [link text](https://example.com/)', false);
      expect(signature5.description).toBe('Example of [link text](https://example.com/)');
    });

    it('Parses signature with type only', () => {
      const signature = new SignatureParser('(number)', false, traits);
      expect(signature.type).toBe('number');
    });

    it('Parses signature with description only', () => {
      const signature = new SignatureParser('- Description', false, traits);
      expect(signature.description).toBe('Description');
      expect(signature.warnings.length).toBe(1);
    });

    it('Parses signature with example only', () => {
      const signature = new SignatureParser('`Example`', false, traits);
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
    });

    it('Parses signature with an escaped empty string as value', () => {
      let signature = new SignatureParser('`` - empty string', false, traits);
      expect(signature.value).toBe('');
      expect(signature.rawValue).toBe('``');
      expect(signature.description).toBe('empty string');

      signature = new SignatureParser('``', false, traits);
      expect(signature.value).toBe('');
      expect(signature.rawValue).toBe('``');
    });

    it('Raises an error if no closing bracket found', () => {
      expect(() => {
        new SignatureParser('Attributes (fixed', false, traits); // eslint-disable-line no-new
      }).toThrow(Error);
    });

    it('Raises an error for unknown parameterized attribute', () => {
      expect(() => {
        new SignatureParser('Attributes (fixed, foo=bar)', false, traits); // eslint-disable-line no-new
      }).toThrow(Error);
    });
  });

  describe('Attributes signature', () => {
    const traits = [ParserTraits.NAME, ParserTraits.ATTRIBUTES];

    it('Parses simple attributes signature', () => {
      const signature = new SignatureParser('Attributes', false, traits);
      expect(signature.name).toBe('Attributes');
    });

    it('Parses typed attributes signature', () => {
      const signature = new SignatureParser('Attributes(User)', false, traits);
      expect(signature.name).toBe('Attributes');
      expect(signature.type).toBe('User');

      const signature2 = new SignatureParser('Attributes(array[boolean])', false, traits);
      expect(signature2.name).toBe('Attributes');
      expect(signature2.type).toBe('array[boolean]');

      const signature3 = new SignatureParser('Attributes (object)', false, traits);
      expect(signature3.name).toBe('Attributes');
      expect(signature3.type).toBe('object');
    });

    it('Parses type attributes on attributes section', () => {
      const signature1 = new SignatureParser('Attributes (fixed)', false, traits);
      expect(signature1.name).toBe('Attributes');
      expect(signature1.typeAttributes).toEqual(['fixed']);

      const signature2 = new SignatureParser('Attributes (object, fixed)', false, traits);
      expect(signature2.name).toBe('Attributes');
      expect(signature2.type).toBe('object');
      expect(signature2.typeAttributes).toEqual(['fixed']);
    });
  });

  describe('Named type signature', () => {
    const traits = [ParserTraits.NAME, ParserTraits.ATTRIBUTES];

    it('Parses simple named type signature', () => {
      const signature = new SignatureParser('User', false, traits);
      expect(signature.name).toBe('User');
    });

    it('Parses named type with a type section', () => {
      const signature = new SignatureParser('User (string)', false, traits);
      expect(signature.name).toBe('User');
      expect(signature.type).toBe('string');
    });

    it('Parses type attributes on named type', () => {
      const signature = new SignatureParser('User (fixed)', false, traits);
      expect(signature.name).toBe('User');
      expect(signature.typeAttributes).toEqual(['fixed']);
    });

    it('Parses type attributes on named type with a type section', () => {
      const signature = new SignatureParser('User (string, fixed)', false, traits);
      expect(signature.name).toBe('User');
      expect(signature.type).toBe('string');
      expect(signature.typeAttributes).toEqual(['fixed']);
    });

    it('Splits multiline signature', () => {
      const signature = new SignatureParser('name: `Example` - Description\nBlockDescription1\nBlockDescription2', false);
      expect(signature.name).toBe('name');
      expect(signature.value).toBe('Example');
      expect(signature.rawValue).toBe('`Example`');
      expect(signature.description).toBe('Description');
      expect(signature.rest).toBe('BlockDescription1\nBlockDescription2');
    });
  });
});
