const SignatureParser = require('./SignatureParser');

new SignatureParser('name: `Example` (string, required) - Description');
new SignatureParser('name (string, required) - Description');
new SignatureParser('name: (string, required) - Description');
new SignatureParser('name: `Example` - Description');