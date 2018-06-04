const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const MSONAttributeElement = require('./elements/MSONAttributeElement');

const SignatureParser = require('../SignatureParser');

module.exports = (Parsers) => {
  // TODO Сделать обработку nestedSection
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(subject);

      const result = new MSONAttributeElement(
        signature.name,
        signature.example,
        signature.type,
        signature.typeAttributes,
        signature.description
      );

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
        } catch (e) {
        }
      }

      return SectionTypes.undefined;
    },
  });
};