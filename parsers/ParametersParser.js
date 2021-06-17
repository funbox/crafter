const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ParametersElement = require('./elements/ParametersElement');

const ParametersRegex = /^[Pp]arameters?$/;

module.exports = (Parsers) => {
  Parsers.ParametersParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
      const parametersList = node.firstChild.next;
      return [(parametersList && parametersList.firstChild) || utils.nextNode(node), new ParametersElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node && node.type === 'item') {
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
      result.parameters.push(childResult);
      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
  return true;
};
