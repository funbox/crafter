const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourceElement = require('./elements/ResourceElement');

const NamelessResourceHeaderRegex = new RegExp(`^${RegExpStrings.uriTemplate}(\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedResourceHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);
const NamelessEndpointHeaderRegex = new RegExp(`^(${RegExpStrings.requestMethods})\\s+${RegExpStrings.uriTemplate}(\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedEndpointHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.requestMethods}\\s+${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title;
      let href;
      let method = '';
      let protoNames = '';
      let nodeToReturn = node;

      context.pushFrame();

      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [sectionType, [matchData, matchDataIndexes]] = getSectionType(subject);

      switch (sectionType) {
        case 'NamedResource':
          title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
          href = utils.makeStringElement(matchData[2], subjectOffset + matchDataIndexes[2], node, context);

          protoNames = matchData[4];
          nodeToReturn = utils.nextNode(node);
          break;
        case 'NamelessResource':
          href = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);

          protoNames = matchData[3];
          nodeToReturn = utils.nextNode(node);
          break;
        case 'NamelessEndpoint':
          method = matchData[2];
          href = utils.makeStringElement(matchData[3], subjectOffset + matchDataIndexes[3], node, context);
          protoNames = matchData[5];
          context.data.endpointActionsCount = 0;
          break;
        case 'NamedEndpoint':
          title = utils.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
          method = matchData[2];
          href = utils.makeStringElement(matchData[3], subjectOffset + matchDataIndexes[3], node, context);
          context.data.endpointActionsCount = 0;
          break;
        default:
          break;
      }

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      const prototypes = protoNames ? protoNames.split(',').map(p => p.trim()) : [];

      prototypes.forEach(prototype => {
        if (!context.resourcePrototypeResolver.prototypes[prototype]) {
          throw new utils.CrafterError(`Unknown resource prototype "${prototype}"`, sourceMap);
        }
      });

      context.resourcePrototypes.push(prototypes);

      context.data.resourceEndpointMethod = method;
      context.data.startNode = node;

      const result = new ResourceElement(href, title, sourceMap);

      return [nodeToReturn, result];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (NamelessEndpointHeaderRegex.exec(subject) || NamedResourceHeaderRegex.exec(subject) || NamedEndpointHeaderRegex.exec(subject) || NamelessResourceHeaderRegex.exec(subject)) {
          return SectionTypes.resource;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      if (context.data.startNode.file !== node.file) {
        return SectionTypes.undefined;
      }

      const result = SectionTypes.calculateSectionType(node, context, [
        Parsers.ActionParser,
        Parsers.ParametersParser,
      ]);

      if (
        result === SectionTypes.action
        && Object.keys(context.data).includes('endpointActionsCount')
        && context.data.endpointActionsCount > 0
      ) {
        return SectionTypes.undefined;
      }

      return result;
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
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
      let nextNode;
      let childResult;

      if (this.nestedSectionType(node, context) === SectionTypes.action) {
        [nextNode, childResult] = Parsers.ActionParser.parse(node, context);
        if (this.checkForActionDuplicates(result, childResult)) {
          const warningMessage = childResult.href
            ? `Action with href "${childResult.href.string}" already defined for resource "${result.href.string}"`
            : `Action with method "${childResult.method.string}" already defined for resource "${result.href.string}"`;
          context.addWarning(warningMessage, childResult.sourceMap);
        }
        result.actions.push(childResult);

        if (Object.keys(context.data).includes('endpointActionsCount')) {
          context.data.endpointActionsCount++;
        }
      } else {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node, context);
        result.parameters = childResult;
      }

      result.sourceMap = utils.mergeSourceMaps([result.sourceMap, childResult.sourceMap], context.sourceBuffer, context.linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      if (result.description) {
        result.sourceMap = utils.mergeSourceMaps([result.sourceMap, result.description.sourceMap], context.sourceBuffer, context.linefeedOffsets);
      }

      const { resourceEndpointMethod } = context.data;
      const metaResource = {
        href: result.href.string,
        method: resourceEndpointMethod,
      };
      if (context.checkResourceExists(metaResource)) {
        context.addWarning(`The resource "${result.href.string}" is already defined`, result.href.sourceMap);
      } else {
        context.addResource(metaResource);
      }
      context.resourcePrototypes.pop(); // очищаем стек с прототипами данного ресурса
      context.popFrame();
      return result;
    },

    checkForActionDuplicates(resource, childAction) {
      return resource.actions.some(action => {
        if (!childAction.href) {
          // compare only method
          return (!action.href && action.method.equals(childAction.method));
        }

        return (
          !!action.href
          && action.href.equals(childAction.href)
          && action.method.equals(childAction.method)
        );
      });
    },
  });
  return true;
};

function getSectionType(subject) {
  const names = [
    [NamelessResourceHeaderRegex, 'NamelessResource'],
    [NamedResourceHeaderRegex, 'NamedResource'],
    [NamelessEndpointHeaderRegex, 'NamelessEndpoint'],
    [NamedEndpointHeaderRegex, 'NamedEndpoint'],
  ];

  for (let i = 0; i < names.length; i++) {
    const [re, name] = names[i];
    const matchResult = utils.matchStringToRegex(subject, re);
    if (matchResult) return [name, matchResult];
  }

  return null;
}
