const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const BodyElement = require('./elements/BodyElement');
const SourceMapElement = require('./elements/SourceMapElement');

const bodyRegex = /^[Bb]ody$/;

module.exports = (Parsers) => {
  Parsers.BodyParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const bodyContentNode = node.firstChild.next;
      const body = (bodyContentNode && bodyContentNode.literal) || '';
      const bodyEl = new BodyElement(body);
      if (context.sourceMapsEnabled && bodyContentNode) {
        bodyEl.sourceMap = this.makeSourceMap(bodyContentNode, context);
      }
      return [utils.nextNode(node), bodyEl];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (bodyRegex.exec(text)) {
          return SectionTypes.response;
        }
      }

      return SectionTypes.undefined;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.BodyParser,
        Parsers.HeadersParser,
        Parsers.ParameterParser,
        Parsers.RequestParser,
        Parsers.ResponseParser,
        Parsers.ActionParser,
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    makeSourceMap(node, context) {
      const byteBlocks = [];
      const startLineIndex = node.sourcepos[0][0] - 1;
      const startColumnIndex = node.sourcepos[0][1] - 1;
      const endLineIndex = node.sourcepos[1][0] - 1;
      const numSpacesPerIndentLevel = 4;
      const linefeedByte = 1;
      const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
      let offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, indentation, context.sourceLines);
      for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
        const line = context.sourceLines[lineIndex];
        if (/\S/.test(line)) {
          const lineWithoutIndentation = line.slice(indentation);
          let length = Buffer.byteLength(lineWithoutIndentation);
          if (lineIndex < context.sourceLines.length - 1) {
            length += linefeedByte;
          }
          byteBlocks.push({ offset, length });
          offset += length;
          offset += indentation;
        } else {
          offset += Buffer.byteLength(line) + linefeedByte;
        }
      }

      return new SourceMapElement(byteBlocks);
    },
  });
};
