module.exports = (Parsers) => {
  Parsers.NamedTypeMemberGroupParser = Object.assign(
    Object.create(require('./AbstractParser')),
    Parsers.MSONMemberGroupParser,
    {
      allowLeavingNode: true,
    },
  );
  return true;
};
