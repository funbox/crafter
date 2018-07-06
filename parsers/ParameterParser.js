const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ParameterElement = require('./elements/ParameterElement');

const SignatureParser = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ParameterParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text);

      const result = new ParameterElement(
        signature.name,
        signature.example,
        signature.type,
        signature.typeAttributes,
        signature.description,
      );

      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') { // TODO: вынести проверку node.type в AbstractParser
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (signature.attributes.length <= 2) {
            return SectionTypes.parameter;
          }
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ParameterDefaultValueParser,
        Parsers.ParameterMembersParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childRes;

      if (Parsers.ParameterDefaultValueParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childRes] = Parsers.ParameterDefaultValueParser.parse(node, context);
        result.defaultValue = childRes;
      } else {
        [nextNode, childRes] = Parsers.ParameterMembersParser.parse(node, context);
        result.enumerations = childRes;
      }

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
