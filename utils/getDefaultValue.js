const { types: { defaults } } = require('../constants');

module.exports = function getDefaultValue(type) {
  return defaults[type] === undefined ? '' : defaults[type];
};
