const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const PropertyMemberElement = require('./elements/PropertyMemberElement');
const DataStructureProcessor = require('./DataStructureProcessor');
const SignatureParser = require('../SignatureParser');

module.exports = (Parsers) => {
  // TODO Сделать обработку nestedSection
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(subject);

      const result = new PropertyMemberElement(
        signature.name,
        signature.type,
        signature.example,
        signature.typeAttributes,
        signature.description,
      );

      const nestedNode = node.firstChild.next;

      if (nestedNode) {
        const dataStructureProcessor = new DataStructureProcessor(nestedNode, Parsers);
        dataStructureProcessor.fillValueMember(result.value, context);
      }

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (signature.name) {
            return SectionTypes.msonAttribute;
          }
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
    },

    // TODO: Корректно парсить многострочное описание параметра
    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
