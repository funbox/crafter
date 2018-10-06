const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourcePrototypeElement = require('./elements/ResourcePrototypeElement');

const PrototypeHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourcePrototypeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let inheritedPrototypes = [];
      const subject = utils.headerText(node, context.sourceLines);
      const matchData = PrototypeHeaderRegex.exec(subject);

      if (matchData[3]) {
        inheritedPrototypes = matchData[3].split(',').map(a => a.trim());
      }

      return [utils.nextNode(node), new ResourcePrototypeElement(matchData[1], inheritedPrototypes)];
    },

    sectionType(node, context) {
      if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
        return SectionTypes.resourcePrototype;
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResponseParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceGroupParser,
        Parsers.ResourcePrototypeParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResponseParser.parse(node, context);
      result.responses.push(childResult);

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    isUnexpectedNode(node, context) {
      return context.sectionKeywordSignature(node) === SectionTypes.undefined && node.type !== 'heading';
    },
  });
};
