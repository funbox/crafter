const appendDescriptionDelimiter = require('./appendDescriptionDelimiter');
const buildPrototypeElements = require('./buildPrototypeElements');
const convertType = require('./convertType');
const extractDescription = require('./extractDescription');
const getCharacterBlocksWithLineColumnInfo = require('./getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('./getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('./getSourcePosZeroBased');
const linefeedBytes = require('./linefeedBytes');
const makeStringElement = require('./makeStringElement');
const matchStringToRegex = require('./matchStringToRegex');
const merge = require('./merge');
const nextNode = require('./nextNode');
const nodeText = require('./nodeText');
const preparePrototypes = require('./preparePrototypes');
const resolveType = require('./resolveType');
const sourceMap = require('./sourceMap');
const splitTypeAttributes = require('./splitTypeAttributes');
const typeAttributesToRefract = require('./typeAttributesToRefract');
const validateAttributesConsistency = require('./validateAttributesConsistency');

const utils = {
  appendDescriptionDelimiter,
  buildPrototypeElements,
  convertType,
  extractDescription,
  getCharacterBlocksWithLineColumnInfo,
  getOffsetFromStartOfFileInBytes,
  getSourcePosZeroBased,
  linefeedBytes,
  makeStringElement,
  matchStringToRegex,
  ...merge,
  nextNode,
  nodeText,
  preparePrototypes,
  resolveType,
  ...sourceMap,
  splitTypeAttributes,
  typeAttributesToRefract,
  validateAttributesConsistency,
};

module.exports = utils;
