const convertType = require('./convertType');
const getCharacterBlocksWithLineColumnInfo = require('./getCharacterBlocksWithLineColumnInfo');
const matchStringToRegex = require('./matchStringToRegex');
const nodeText = require('./nodeText');
const resolveType = require('./resolveType');
const sourceMap = require('./sourceMap');
const splitTypeAttributes = require('./splitTypeAttributes');
const typeAttributesToRefract = require('./typeAttributesToRefract');
const validateAttributesConsistency = require('./validateAttributesConsistency');

const utils = {
  convertType,
  getCharacterBlocksWithLineColumnInfo,
  matchStringToRegex,
  nodeText,
  resolveType,
  ...sourceMap,
  splitTypeAttributes,
  typeAttributesToRefract,
  validateAttributesConsistency,
};

module.exports = utils;
