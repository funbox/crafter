const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const SignatureParser = require('../SignatureParser');

const parameterIdentifierRegex = /^`?(([\w.-])*|(%[A-Fa-f0-9]{2})*)+`?/;
const parameterExampleRegex = /^`?[^`]+`?/;

module.exports = (Parsers) => {
  Parsers.ParameterParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      result.element = Refract.elements.member;

      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
      const signature = new SignatureParser(text);

      result.content = {
        key: {
          element: Refract.elements.string,
          content: signature.name,
        },
      };

      if (signature.example) {
        result.content.value = {
          element: Refract.elements.string,
          content: signature.example,
        };
      }

      let index;

      if (signature.typeAttributes.length) {
        result.attributes = {
          typeAttributes: signature.typeAttributes.map(a => ({
            element: 'string',
            content: a
          }))
        };
      }

      const description = signature.description;
      const type = signature.otherAttributes.length > 0 ? signature.otherAttributes[0] : null;

      if (description || type) {
        result.meta = {};
      }

      if (description) {
        result.meta.description = {
          element: 'string',
          content: description
        };
      }

      if (type) {
        result.meta.title = type;
      }

      return node.firstChild.next && node.firstChild.next.firstChild || utils.nextNode(node);
    },

    sectionType(node, context) {
      if (node.type === 'item') { // TODO: вынести проверку node.type в AbstractParser
        const text = utils.nodeText(node.firstChild, context.sourceLines).trim();

        try {
          const signature = new SignatureParser(text);
          if (signature.attributes.length <= 2) {
            return SectionTypes.parameter;
          }
        } catch (e) {
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ParameterDefaultValueParser,
        Parsers.ParameterMembersParser
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode, childRes;

      if (!result.content.value) {
        result.content.value = {};
      }

      if (!result.content.value.attributes) {
        result.content.value.attributes = {};
      }


      if (Parsers.ParameterDefaultValueParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childRes] = Parsers.ParameterDefaultValueParser.parse(node, context);
        result.content.value.attributes.default = childRes;
      } else {
        [nextNode, childRes] = Parsers.ParameterMembersParser.parse(node, context);
        result.content.value.attributes.enumerations = childRes;
      }

      return nextNode;
    },

    processDescription(node) {
      return node;
    }
  });
};