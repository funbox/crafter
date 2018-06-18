const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SignatureParser = require('../SignatureParser');
const MSONNamedTypeElement = require('./elements/MSONNamedTypeElement');
const DataStructureProcessor = require('./DataStructureProcessor');

module.exports = (Parsers) => {
  Parsers.MSONNamedTypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.headerText(node, context.sourceLines);
      const signature = new SignatureParser(subject);

      return [utils.nextNode(node), new MSONNamedTypeElement(signature.name, signature.type, signature.typeAttributes)];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.MSONNamedType;
      }

      return SectionTypes.undefined;
    },

    processNestedSections(node, context, result) {
      if (!node) {
        return [node, result];
      }

      let contentNode = node.parent;
      if (contentNode.type === 'list') {
        const dataStructureProcessor = new DataStructureProcessor(contentNode, Parsers);
        dataStructureProcessor.fillValueMember(result.content, context);
      } else {
        // TODO: Что делать в этом случае?
      }

      return [utils.nextNode(contentNode), result];
    },

    skipSectionKeywordSignature: true,
  });
};
