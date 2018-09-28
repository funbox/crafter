const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ResourcePrototypesElement = require('./elements/ResourcePrototypesElement');

const ResourcePrototypesRegex = /^[Rr]esource\s+[Pp]rototypes$/;

module.exports = (Parsers) => {
  Parsers.ResourcePrototypesParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node) {
      return [utils.nextNode(node), new ResourcePrototypesElement()];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (ResourcePrototypesRegex.exec(subject)) {
          return SectionTypes.resourcePrototypes;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResourcePrototypeParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResourcePrototypeParser.parse(node, context);
      result.resourcePrototypes.push(childResult);
      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },
  });
};
