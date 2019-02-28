module.exports = (Parsers) => {
  const baseParsers = [
    Parsers.MSONMemberGroupParser,
  ];
  if (baseParsers.some(parser => !parser)) return false;

  Parsers.NamedTypeMemberGroupParser = Object.assign(
    Object.create(require('./AbstractParser')),
    ...baseParsers,
    {
      allowLeavingNode: true,
    },
  );
  return true;
};
