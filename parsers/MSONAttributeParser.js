const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const SignatureParser = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim(); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(text);

      result.element = 'member';

      if (signature.description) {
        result.meta = {
          description: signature.description
        };
      }

      if (signature.typeAttributes.length) {
        result.attributes = {
          typeAttributes: signature.typeAttributes.map(a => ({
            element: 'string',
            content: a
          }))
        };
      }

      result.content = {
        key: {
          element: 'string',
          content: signature.name
        }
      };

      const type = signature.otherAttributes.length ? signature.otherAttributes[0] : 'string';
      result.content.value = {
        element: type
      };

      if (signature.example) {
        result.content.value.content = signature.example;
      }

      return utils.nextNode(node);
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