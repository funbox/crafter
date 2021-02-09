const SectionTypes = require('../SectionTypes');
const utilsHelpers = require('../utils/index');
const SchemaNamedTypeElement = require('./elements/SchemaNamedTypeElement');

const { CrafterError } = utilsHelpers;

module.exports = (Parsers) => {
  Parsers.SchemaNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      context.pushFrame();

      const [subject, subjectOffset] = utilsHelpers.headerTextWithOffset(node, context.sourceLines);
      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      context.data.attributeSignatureDetails = { sourceMap };

      const name = utilsHelpers.makeStringElement(subject, subjectOffset, node, context);

      const result = new SchemaNamedTypeElement(name, sourceMap);

      return [utilsHelpers.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.schemaNamedType;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.BodyParser,
        Parsers.SchemaParser,
      ]);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.SchemaNamedTypeParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const { attributeSignatureDetails: details } = context.data;

      let nextNode;
      let childResult;

      if (Parsers.BodyParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.BodyParser.parse(node, context);
        if (!result.bodyEl) {
          result.bodyEl = childResult;
        } else {
          throw new CrafterError('Schema named type could contain only one body section', details.sourceMap);
        }
      } else {
        [nextNode, childResult] = Parsers.SchemaParser.parse(node, context);
        if (!result.schemaEl) {
          result.schemaEl = childResult;
        } else {
          throw new CrafterError('Schema named type could contain only one schema section', details.sourceMap);
        }
      }

      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);
      if (result.description) {
        result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, result.description.sourceMap], sourceBuffer, linefeedOffsets);
      }

      result.sourceMap = utils.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps], sourceBuffer, linefeedOffsets);

      const { attributeSignatureDetails: details } = context.data;

      context.popFrame();

      if (context.languageServerMode) {
        return result;
      }

      if (!result.bodyEl) throw new CrafterError('Schema named type element must contain body section', details.sourceMap);
      if (!result.schemaEl) throw new CrafterError('Schema named type element must contain schema section', details.sourceMap);

      try {
        result.body = JSON.parse(result.bodyEl.body);
      } catch (e) {
        throw new CrafterError('Body section in schema named type element is invalid JSON', details.sourceMap);
      }

      return result;
    },
  });

  return true;
};
