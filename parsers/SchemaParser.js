const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SchemaElement = require('./elements/SchemaElement');
const SourceMapElement = require('./elements/SourceMapElement');

const schemaRegex = /^[Ss]chema$/;

module.exports = (Parsers) => {
  Parsers.SchemaParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const schemaContentNode = node.firstChild.next;
      const schemaText = (schemaContentNode && schemaContentNode.literal) || '';
      let schemaObj;
      try {
        schemaObj = JSON.parse(schemaText);
      } catch (e) {
        const warnMessage = (!schemaText && schemaContentNode.type !== 'code_block')
          ? `message-schema at line ${node.sourcepos[0][0]} is expected to be a pre-formatted code block, every of its line indented by exactly 12 spaces or 3 tabs`
          : `invalid JSON Schema at line ${node.sourcepos[0][0]}`;
        context.logger.warn(warnMessage);
        schemaObj = {};
      }
      const schemaEl = new SchemaElement(schemaObj);
      if (context.sourceMapsEnabled && schemaContentNode) {
        schemaEl.sourceMap = this.makeSourceMap(schemaContentNode, context);
      }
      return [utils.nextNode(node), schemaEl];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (schemaRegex.exec(text)) {
          return SectionTypes.schema;
        }
      }

      return SectionTypes.undefined;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.BodyParser,
        Parsers.HeadersParser,
        Parsers.SchemaParser,
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
      const { startLineIndex, startColumnIndex, endLineIndex } = utils.getSourcePosZeroBased(node);
      const numSpacesPerIndentLevel = 4;
      const indentation = Math.floor(startColumnIndex / numSpacesPerIndentLevel) * numSpacesPerIndentLevel;
      let offset = utils.getOffsetFromStartOfFileInBytes(startLineIndex, indentation, context.sourceLines);
      for (let lineIndex = startLineIndex; lineIndex <= endLineIndex; lineIndex += 1) {
        const line = context.sourceLines[lineIndex];
        if (/\S/.test(line)) {
          const lineWithoutIndentation = line.slice(indentation);
          let length = Buffer.byteLength(lineWithoutIndentation);
          if (lineIndex < context.sourceLines.length - 1) {
            length += utils.linefeedBytes;
          }
          byteBlocks.push({ offset, length });
          offset += length;
          offset += indentation;
        } else {
          offset += Buffer.byteLength(line) + utils.linefeedBytes;
        }
      }

      return new SourceMapElement(byteBlocks, node.file);
    },
  });
};
