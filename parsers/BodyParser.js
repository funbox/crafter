const SectionTypes = require('../SectionTypes');
const utilsHelpers = require('../utils/index');
const BodyElement = require('./elements/BodyElement');

const bodyRegex = /^[Bb]ody$/;

module.exports = (Parsers) => {
  Parsers.BodyParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const bodyContentNode = node.firstChild.next;

      if (!bodyContentNode) {
        const bodyEl = new BodyElement('');
        bodyEl.sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
        return [utilsHelpers.nextNode(node), bodyEl];
      }

      const body = bodyContentNode.literal || '';
      const bodyEl = new BodyElement(body);
      const sourceMap = this.makeSourceMap(bodyContentNode, context);
      if (bodyContentNode.type !== 'code_block') {
        context.addWarning('"Body" is expected to be a pre-formatted code block, every of its line indented by exactly 12 spaces or 3 tabs', sourceMap);
      }
      bodyEl.sourceMap = sourceMap;
      return [utilsHelpers.nextNode(node), bodyEl];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
        if (bodyRegex.exec(text)) {
          return SectionTypes.body;
        }
      }

      return SectionTypes.undefined;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.BodyParser,
        Parsers.SchemaParser,
        Parsers.HeadersParser,
        Parsers.RequestParser,
        Parsers.ResponseParser,
        Parsers.ActionParser,
        Parsers.ResourceParser,
        Parsers.SubgroupParser,
        Parsers.MessageParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.SchemaNamedTypeParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    makeSourceMap(node, context) {
      return utilsHelpers.makeSourceMapForAsset(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
    },

    allowLeavingNode: false,
  });
  return true;
};
