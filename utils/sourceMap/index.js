const concatSourceMaps = require('./concatSourceMaps');
const makeGenericSourceMap = require('./makeGenericSourceMap');
const makeGenericSourceMapFromStartAndEndNodes = require('./makeGenericSourceMapFromStartAndEndNodes');
const makeSourceMapForAsset = require('./makeSourceMapForAsset');
const makeSourceMapForDescription = require('./makeSourceMapForDescription');
const makeSourceMapForLine = require('./makeSourceMapForLine');
const makeSourceMapsForInlineValues = require('./makeSourceMapsForInlineValues');
const makeSourceMapsForStartPosAndLength = require('./makeSourceMapsForStartPosAndLength');
const makeSourceMapsForString = require('./makeSourceMapsForString');
const mergeSourceMaps = require('./mergeSourceMaps');

const SourceMap = require('./SourceMap');

module.exports = {
  concatSourceMaps,
  makeGenericSourceMap,
  makeGenericSourceMapFromStartAndEndNodes,
  makeSourceMapForAsset,
  makeSourceMapForDescription,
  makeSourceMapForLine,
  makeSourceMapsForInlineValues,
  makeSourceMapsForStartPosAndLength,
  makeSourceMapsForString,
  mergeSourceMaps,
  SourceMap,
};
