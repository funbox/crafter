const SignatureParser = require('../SignatureParser');

describe('SignatureParser', () => {
  it('Parses signature with name, example, type, type attributes and description', () => {
    const signature = new SignatureParser('name: `Example` (string, required) - Description');
    expect(signature.name).toEqual('name');
    expect(signature.example).toEqual('Example');
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
    expect(signature.example).toEqual('');
    expect(signature.type).toEqual('string');
    expect(signature.typeAttributes).toEqual(['required']);
    expect(signature.description).toEqual('Description');
  });

  it('Parses signature with name, example and description', () => {
    const signature = new SignatureParser('name: `Example` - Description');
    expect(signature.name).toEqual('name');
    expect(signature.example).toEqual('Example');
    expect(signature.description).toEqual('Description');
  });
});
