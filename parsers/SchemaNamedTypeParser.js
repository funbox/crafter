const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SchemaNamedTypeElement = require('./elements/SchemaNamedTypeElement');
const StringElement = require('./elements/StringElement');

const { CrafterError } = utils;

module.exports = (Parsers) => {
  Parsers.SchemaNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      context.data.attributeSignatureDetails = { sourceMap };

      const name = new StringElement(subject);
      name.sourceMap = sourceMap;

      const result = new SchemaNamedTypeElement(name);

      return [utils.nextNode(node), result];
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
        if (!result.body) {
          result.body = childResult;
        } else {
          throw new CrafterError('Schema named type could contain only one body section', details.sourceMap);
        }
      } else {
        [nextNode, childResult] = Parsers.SchemaParser.parse(node, context);
        if (!result.schema) {
          result.schema = childResult;
        } else {
          throw new CrafterError('Schema named type could contain only one schema section', details.sourceMap);
        }
      }

      return [nextNode, result];
    },

    finalize(context, result) {
      const { attributeSignatureDetails: details } = context.data;

      if (!result.body) throw new CrafterError('Schema named type element must contain body section', details.sourceMap);
      if (!result.schema) throw new CrafterError('Schema named type element must contain schema section', details.sourceMap);

      try {
        JSON.parse(result.body.body);
      } catch (e) {
        throw new CrafterError('Body section in schema named type element is invalid JSON', details.sourceMap);
      }

      return result;
    },
  });

  return true;
};