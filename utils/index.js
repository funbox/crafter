const convertType = require('./convertType');
const getCharacterBlocksWithLineColumnInfo = require('./getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('./getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('./getSourcePosZeroBased');
const linefeedBytes = require('./linefeedBytes');
const matchStringToRegex = require('./matchStringToRegex');
const nextNode = require('./nextNode');
const nodeText = require('./nodeText');
const resolveType = require('./resolveType');
const sourceMap = require('./sourceMap');
const splitTypeAttributes = require('./splitTypeAttributes');
const typeAttributesToRefract = require('./typeAttributesToRefract');
const validateAttributesConsistency = require('./validateAttributesConsistency');

const utils = {
  convertType,
  getCharacterBlocksWithLineColumnInfo,
  getOffsetFromStartOfFileInBytes,
  getSourcePosZeroBased,
  linefeedBytes,
  matchStringToRegex,
  nextNode,
  nodeText,
  resolveType,
  ...sourceMap,
  splitTypeAttributes,
  typeAttributesToRefract,
  validateAttributesConsistency,
};

module.exports = utils;
