module.exports = (Parsers) => {
  const baseParsers = [
    Parsers.DefaultValueParser,
  ];
  if (baseParsers.some(parser => !parser)) return false;

  Parsers.DefaultHeaderParser = Object.assign(
    Object.create(require('./AbstractParser')),
    ...baseParsers,
    {
      allowLeavingNode: true,
    },
  );
  return true;
};
