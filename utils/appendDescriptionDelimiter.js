module.exports = function appendDescriptionDelimiter(s) {
  if (s[s.length - 1] !== '\n') {
    s += '\n';
  }
  if (s[s.length - 2] !== '\n') {
    s += '\n';
  }

  return s;
};
