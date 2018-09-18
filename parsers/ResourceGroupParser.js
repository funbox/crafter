const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourceGroupElement = require('./elements/ResourceGroupElement');
const StringElement = require('./elements/StringElement');

const GroupHeaderRegex = new RegExp(`^[Gg]roup\\s+${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const matchData = GroupHeaderRegex.exec(utils.headerText(node, context.sourceLines));
      const prototypes = matchData[3] ? matchData[3].split(',').map(p => p.trim()) : [];
      const title = new StringElement(matchData[1]);
      if (context.sourceMapsEnabled) {
        title.sourceMap = utils.makeGenericSourceMap(node, context.sourceLines);
      }
      const result = new ResourceGroupElement(title);

      context.resourcePrototypes.push(prototypes);
      return [utils.nextNode(node), result];
    },
    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (GroupHeaderRegex.exec(subject)) {
          return SectionTypes.resourceGroup;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return Parsers.ResourceParser.sectionType(node, context);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      const [nextNode, childResult] = Parsers.ResourceParser.parse(node, context);
      result.resources.push(childResult);
      return [nextNode, result];
    },

    finalize(context, result) {
      context.resourcePrototypes.pop(); // очищаем стек с прототипами данной группы ресурсов
      return result;
    },
  });
};
