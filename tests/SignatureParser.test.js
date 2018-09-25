const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

// TODO: Нужно больше тестов

describe('SignatureParser', () => {
  it('Parses signature with name, example, type, type attributes and description', () => {
    const signature = new SignatureParser('name: `Example` (string, required) - Description');
    expect(signature.name).toEqual('name');
    expect(signature.value).toEqual('Example');
    expect(signature.type).toEqual('string');
    expect(signature.typeAttributes).toEqual(['required']);
    expect(signature.description).toEqual('Description');
  });

  it('Parses signature with name, type, type attributes and description', () => {
    const signature = new SignatureParser('name (string, required) - Description');
    expect(signature.name).toEqual('name');
    expect(signature.type).toEqual('string');
    expect(signature.typeAttributes).toEqual(['required']);
    expect(signature.description).toEqual('Description');
  });

  it('Parses signature with empty example', () => {
    const signature = new SignatureParser('name: (string, required) - Description');
    expect(signature.name).toEqual('name');
    expect(signature.value).toEqual('');
    expect(signature.type).toEqual('string');
    expect(signature.typeAttributes).toEqual(['required']);
    expect(signature.description).toEqual('Description');
  });

  it('Parses signature with name, example and description', () => {
    const signature = new SignatureParser('name: `Example` - Description');
    expect(signature.name).toEqual('name');
    expect(signature.value).toEqual('Example');
    expect(signature.description).toEqual('Description');
  });

  it('Parses signature with name quoting', () => {
    const signature = new SignatureParser('`name`: `Example` - Description');
    expect(signature.name).toEqual('name');
    expect(signature.value).toEqual('Example');
    expect(signature.description).toEqual('Description');
  });

  describe('Value Type', () => {
    it('Parses signature without example', () => {
      const signature = new SignatureParser('(string) - Description', [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
      expect(signature.type).toEqual('string');
      expect(signature.description).toEqual('Description');
    });

    it('Parses signature with example', () => {
      const signature = new SignatureParser('Example (string) - Description', [ParserTraits.VALUE, ParserTraits.ATTRIBUTES, ParserTraits.DESCRIPTION]);
      expect(signature.value).toEqual('Example');
      expect(signature.type).toEqual('string');
      expect(signature.description).toEqual('Description');
    });
  });
});
