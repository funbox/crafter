const appendDescriptionDelimiter = require('./appendDescriptionDelimiter');
const buildPrototypeElements = require('./buildPrototypeElements');
const compareAttributeTypes = require('./compareAttributeTypes');
const convertType = require('./convertType');
const defaultValue = require('./defaultValue');
const extractDescription = require('./extractDescription');
const getCharacterBlocksWithLineColumnInfo = require('./getCharacterBlocksWithLineColumnInfo');
const getOffsetFromStartOfFileInBytes = require('./getOffsetFromStartOfFileInBytes');
const getSourcePosZeroBased = require('./getSourcePosZeroBased');
const linefeedBytes = require('./linefeedBytes');
const log = require('./log');
const makeStringElement = require('./makeStringElement');
const markdownSourceToAST = require('./markdownSourceToAST');
const matchStringToRegex = require('./matchStringToRegex');
const merge = require('./merge');
const node = require('./node');
const preparePrototypes = require('./preparePrototypes');
const resolveType = require('./resolveType');
const sourceMap = require('./sourceMap');
const splitTypeAttributes = require('./splitTypeAttributes');
const typeAttributesToRefract = require('./typeAttributesToRefract');
const isTypeReferred = require('./isTypeReferred');
const isTypeUsedByElement = require('./isTypeUsedByElement');
const validateAttributesConsistency = require('./validateAttributesConsistency');

const utils = {
  appendDescriptionDelimiter,
  buildPrototypeElements,
  compareAttributeTypes,
  convertType,
  defaultValue,
  extractDescription,
  getCharacterBlocksWithLineColumnInfo,
  getOffsetFromStartOfFileInBytes,
  getSourcePosZeroBased,
  linefeedBytes,
  ...log,
  makeStringElement,
  markdownSourceToAST,
  matchStringToRegex,
  ...merge,
  ...node,
  preparePrototypes,
  resolveType,
  ...sourceMap,
  splitTypeAttributes,
  typeAttributesToRefract,
  isTypeUsedByElement,
  isTypeReferred,
  validateAttributesConsistency,
};

module.exports = utils;
