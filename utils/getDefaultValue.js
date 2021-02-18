module.exports = function getDefaultValue(type) {
  const valueByType = {
    boolean: true,
    number: 1,
    string: 'hello',
    array: [],
    object: {},
    file: 'hello',
    enum: 'hello',
  };
  return valueByType[type] === undefined ? '' : valueByType[type];
};
