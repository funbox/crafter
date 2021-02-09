const SectionTypes = require('../SectionTypes');
const utilsHelpers = require('../utils/index');
const ParametersElement = require('./elements/ParametersElement');

const ParametersRegex = /^[Pp]arameters?$/;

module.exports = (Parsers) => {
  Parsers.ParametersParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const parametersList = node.firstChild.next;
      return [(parametersList && parametersList.firstChild) || utilsHelpers.nextNode(node), new ParametersElement(sourceMap)];
    },

    sectionType(node, context) {
      if (node && node.type === 'item') {
        const text = utilsHelpers.nodeText(node.firstChild, context.sourceLines);
        if (ParametersRegex.exec(text)) {
          return SectionTypes.parameters;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ParameterParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.RequestParser,
        Parsers.ResponseParser,
        Parsers.ActionParser,
        Parsers.ResourceParser,
        Parsers.SubgroupParser,
        Parsers.MessageParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
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
