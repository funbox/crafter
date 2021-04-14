const concatSourceMaps = require('./concatSourceMaps');
const makeGenericSourceMap = require('./makeGenericSourceMap');
const makeGenericSourceMapFromStartAndEndNodes = require('./makeGenericSourceMapFromStartAndEndNodes');
const makeSourceMapForDescription = require('./makeSourceMapForDescription');
const makeSourceMapForLine = require('./makeSourceMapForLine');
const makeSourceMapsForInlineValues = require('./makeSourceMapsForInlineValues');
const makeSourceMapsForStartPosAndLength = require('./makeSourceMapsForStartPosAndLength');
const makeSourceMapsForString = require('./makeSourceMapsForString');

const SourceMap = require('./SourceMap');

module.exports = {
  concatSourceMaps,
  makeGenericSourceMap,
  makeGenericSourceMapFromStartAndEndNodes,
  makeSourceMapForDescription,
  makeSourceMapForLine,
  makeSourceMapsForInlineValues,
  makeSourceMapsForStartPosAndLength,
  makeSourceMapsForString,
  SourceMap,
};
