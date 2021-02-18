const { types } = require('../constants');

module.exports = function resolveType(type) {
  const result = {
    type,
    nestedTypes: [],
    nestedTypesOffsets: [],
  };

  if (!type) return result;

  const matchData = /^(.*?)\s*(\[(.*)])?$/.exec(type);
  const resolvedType = matchData[1];
  result.type = types[resolvedType] || resolvedType;
  if (matchData[3]) {
    let currentOffset = type.indexOf(matchData[3]);
    matchData[3].split(',').forEach(rawType => {
      const trimmedType = rawType.trim();
      if (trimmedType) {
        result.nestedTypes.push(trimmedType);
        result.nestedTypesOffsets.push(currentOffset + rawType.indexOf(trimmedType));
      }
      currentOffset += rawType.length;
    });
  }

  return result;
};
