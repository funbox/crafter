const getCharacterBlocksWithLineColumnInfo = require('../getCharacterBlocksWithLineColumnInfo');
const SourceMap = require('./SourceMap');
const ByteBlock = require('./ByteBlock');
const utilsLog = require('../log');

module.exports = function mergeSourceMaps(sourceMaps, sourceBuffer, linefeedOffsets) {
  let fileFetched = false;
  let file;
  let offset = Number.MAX_VALUE;

  sourceMaps.forEach(sm => {
    sm.byteBlocks.forEach(bb => {
      if (!fileFetched) {
        file = bb.file;
        fileFetched = true;
      } else if (file !== bb.file) {
        throw new utilsLog.CrafterError('Can not expand source maps from different files');
      }

      if (offset > bb.offset) {
        offset = bb.offset;
      }
    });
  });

  const byteBlock = new ByteBlock(offset, -1, file);

  sourceMaps.forEach(sm => {
    sm.byteBlocks.forEach(bb => {
      byteBlock.length = Math.max(byteBlock.length, bb.offset + bb.length - byteBlock.offset);
    });
  });

  const byteBlocks = [byteBlock];
  const charBlocks = getCharacterBlocksWithLineColumnInfo(byteBlocks, sourceBuffer, linefeedOffsets);
  return new SourceMap(byteBlocks, charBlocks);
};
