const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const ParametersRegex = /^[Pp]arameters?$/;

module.exports = (Parsers) => {
  Parsers.ParametersParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      result.element = Refract.elements.hrefVariables;

      const parametersList = node.firstChild.next;
      return parametersList && parametersList.firstChild || utils.nextNode(node);
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (ParametersRegex.exec(text)) {
          return SectionTypes.parameters;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ParameterParser.sectionType(node, context);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ParameterParser.parse(node, context);
      result.content.push(childResult);
      return nextNode;
    },

    processDescription(node) {
      return node;
    }
  });
};