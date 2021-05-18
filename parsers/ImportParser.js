const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

const ImportRegex = /^[Ii]mport\s+(.+)$/;

module.exports = (Parsers) => {
  Parsers.ImportParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      return [utils.nextNode(node), { sourceMap }]; // TODO: отдельный элемент для импорта?
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (ImportRegex.test(subject)) {
          return SectionTypes.import;
        }
      }

      return SectionTypes.undefined;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ImportParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSections(node, context, result) {
      return [node, result];
    },

    getFilename(node, context) {
      return ImportRegex.exec(utils.headerText(node, context.sourceLines))[1].trim();
    },
  });
  return true;
};
