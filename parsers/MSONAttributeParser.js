const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const MSONAttributeElement = require('./elements/MSONAttributeElement');

const SignatureParser = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim(); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(text);

      const result = new MSONAttributeElement(
        signature.name,
        signature.example,
        signature.otherAttributes[0],
        signature.typeAttributes,
        signature.description
      );

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines).trim();

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