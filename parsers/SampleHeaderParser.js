module.exports = (Parsers) => {
  const baseParsers = [
    Parsers.SampleValueParser,
  ];
  if (baseParsers.some(parser => !parser)) return false;

  Parsers.SampleHeaderParser = Object.assign(
    Object.create(require('./AbstractParser')),
    ...baseParsers,
    {
      allowLeavingNode: true,
    },
  );
  return true;
};
