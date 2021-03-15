const requestMethods = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'OPTIONS',
  'PATCH',
  'PROPPATCH',
  'LOCK',
  'UNLOCK',
  'COPY',
  'MOVE',
  'MKCOL',
  'HEAD',
  'LINK',
  'UNLINK',
  'CONNECT',
];

module.exports = {
  requestMethods: `(${requestMethods.join('|')})`,
  uriTemplate: '(/[^(]*)',
  symbolIdentifier: '([^\\]\\[\\(\\)]+)',
  resourcePrototype: '\\(([^\\]\\[\\(\\)]+)\\)',
  mediaType: '(\\s*\\(([^\\)]*)\\))',
  languageServerResourcePrototype: '\\((((([^\\]\\[\\(\\)]+)\\)?))?)?',
};
