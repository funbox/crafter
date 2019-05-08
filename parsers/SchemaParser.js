const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SchemaElement = require('./elements/SchemaElement');

const schemaRegex = /^[Ss]chema$/;

module.exports = (Parsers) => {
  Parsers.SchemaParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const schemaContentNode = node.firstChild.next;

      let sourceMap = null;
      if (schemaContentNode) {
        sourceMap = this.makeSourceMap(schemaContentNode, context);
      }

      const schemaText = (schemaContentNode && schemaContentNode.literal) || '';
      let schemaObj;
      try {
        schemaObj = JSON.parse(schemaText);
      } catch (e) {
        const warnMessage = (!schemaText && schemaContentNode.type !== 'code_block')
          ? `message-schema at line ${node.sourcepos[0][0]} is expected to be a pre-formatted code block, every of its line indented by exactly 12 spaces or 3 tabs`
          : `invalid JSON Schema at line ${node.sourcepos[0][0]}`;
        context.addWarning(warnMessage, sourceMap);
        schemaObj = {};
      }
      const schemaEl = new SchemaElement(schemaObj);
      schemaEl.sourceMap = sourceMap;
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
      return utils.makeSourceMapForAsset(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    },
  });
  return true;
};
