const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');
const StringElement = require('./elements/StringElement');
const DataStructureProcessor = require('./DataStructureProcessor');

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);
      const signature = new SignatureParser(subject, [ParserTraits.NAME, ParserTraits.ATTRIBUTES]);
      signature.warnings.forEach(warning => context.logger.warn(warning));

      const name = new StringElement(signature.name);
      if (context.sourceMapsEnabled) {
        name.sourceMap = utils.makeGenericSourceMap(node, context.sourceLines);
      }

      return [utils.nextNode(node), new MSONNamedTypeElement(name, signature.type, signature.typeAttributes)];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.OneOfTypeParser,
        Parsers.MSONMixinParser,
        Parsers.MSONAttributeParser,
      ]);
    },

    processNestedSections(node, context, result) {
      if (!node) {
        return [node, result];
      }

      let contentNode = node.parent;

      if (utils.headerText(node, context.sourceLines) === 'Properties') {
        if (utils.nextNode(node).parent.type === 'list') {
          contentNode = utils.nextNode(node).parent;
        } else {
          contentNode = node;
        }
      }

      if (contentNode.type === 'list') {
        const dataStructureProcessor = new DataStructureProcessor(contentNode, Parsers);
        dataStructureProcessor.fillValueMember(result.content, context);
      } else {
        // TODO: Что делать в этом случае?
      }

      return [utils.nextNode(contentNode), result];
    },

    processDescription(node, context, result) {
      if (node && node.type === 'paragraph') {
        const [curNode, desc] = utils.extractDescription(node, context.sourceLines, context.sourceMapsEnabled);

        result.description = desc;

        return [curNode, result];
      }

      return [node, result];
    },
  });
};
