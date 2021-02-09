const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourceGroupElement = require('./elements/ResourceGroupElement');

const GroupHeaderRegex = new RegExp(`^[Gg]roup\\s+${RegExpStrings.symbolIdentifier}(\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceGroupParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      context.pushFrame();

      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [matchData, matchDataIndexes] = utils.matchStringToRegex(subject, GroupHeaderRegex);
      const title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      context.data.groupSignatureDetails = { sourceMap };

      const protoElements = utils.buildPrototypeElements(matchData[3], subjectOffset + matchDataIndexes[3], node, context);
      context.resourcePrototypes.push(utils.preparePrototypes(protoElements.map(el => el.string), context, sourceMap));

      const result = new ResourceGroupElement(title, protoElements, sourceMap);

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
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.MessageParser,
        Parsers.SubgroupParser,
        Parsers.ResourceParser,
      ]);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      const { groupSignatureDetails: { sourceMap } } = context.data;
      const mixedContentError = new utils.CrafterError(`Found mixed content of subgroups and resources in group "${result.title.string}"`, sourceMap);
      const nestedSectionType = SectionTypes.calculateSectionType(node, context, [
        Parsers.MessageParser,
        Parsers.SubgroupParser,
        Parsers.ResourceParser,
      ]);

      if ([SectionTypes.subGroup, SectionTypes.message].includes(nestedSectionType)) {
        if (context.resourcePrototypes[0] && context.resourcePrototypes[0].length > 0) {
          context.addWarning('A group with subgroups should not use resource prototypes. Adding one will have no effect.', sourceMap);
          context.resourcePrototypes.pop(); // очищаем стек с прототипами данной группы ресурсов
        }
      }

      switch (nestedSectionType) {
        case SectionTypes.subGroup:
          if (result.resources.length > 0) {
            throw mixedContentError;
          }
          [nextNode, childResult] = Parsers.SubgroupParser.parse(node, context);
          result.subgroups.push(childResult);
          break;
        case SectionTypes.message:
          if (result.resources.length > 0) {
            throw mixedContentError;
          }
          [nextNode, childResult] = Parsers.MessageParser.parse(node, context);
          result.subgroups.push(childResult);
          break;
        default:
          if (result.subgroups.length > 0) {
            throw mixedContentError;
          }
          [nextNode, childResult] = Parsers.ResourceParser.parse(node, context);
          result.resources.push(childResult);
      }

      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utils.mergeSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      if (result.description) {
        const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
        const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
        result.sourceMap = utils.mergeSourceMaps([result.sourceMap, result.description.sourceMap], sourceBuffer, linefeedOffsets);
      }

      context.resourcePrototypes.pop(); // очищаем стек с прототипами данной группы ресурсов
      context.popFrame();
      return result;
    },
  });
  return true;
};
