const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourceElement = require('./elements/ResourceElement');
const StringElement = require('./elements/StringElement');

const NamelessResourceHeaderRegex = new RegExp(`^${RegExpStrings.uriTemplate}(\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedResourceHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);
const NamelessEndpointHeaderRegex = new RegExp(`^(${RegExpStrings.requestMethods})\\s+${RegExpStrings.uriTemplate}(\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedEndpointHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.requestMethods}\\s+${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title = '';
      let href = '';
      let method = '';
      let protoNames = '';
      let nodeToReturn = node;

      context.pushFrame();

      const subject = utils.headerText(node, context.sourceLines);
      const [sectionType, matchData] = getSectionType(subject);

      let isNamedEndpoint = false;

      switch (sectionType) {
        case 'NamedResource':
          title = matchData[1];
          href = matchData[2];
          protoNames = matchData[4];
          nodeToReturn = utils.nextNode(node);
          break;
        case 'NamelessResource':
          href = matchData[1];
          protoNames = matchData[3];
          nodeToReturn = utils.nextNode(node);
          break;
        case 'NamelessEndpoint':
          method = matchData[2];
          href = matchData[3];
          protoNames = matchData[5];
          context.data.namelessEndpointActionsCount = 0;
          break;
        case 'NamedEndpoint':
          title = matchData[1];
          method = matchData[2];
          href = matchData[3];
          isNamedEndpoint = true;
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

      const titleEl = new StringElement(title);
      const hrefEl = new StringElement(href);

      context.data.resourceEndpointMethod = method;

      if (!isNamedEndpoint && title) {
        titleEl.sourceMap = sourceMap;
      }

      hrefEl.sourceMap = sourceMap;

      const result = new ResourceElement(titleEl, hrefEl);

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
      const result = SectionTypes.calculateSectionType(node, context, [
        Parsers.ActionParser,
        Parsers.ParametersParser,
      ]);

      if (
        result === SectionTypes.action
        && Object.keys(context.data).includes('namelessEndpointActionsCount')
        && context.data.namelessEndpointActionsCount > 0
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

        if (Object.keys(context.data).includes('namelessEndpointActionsCount')) {
          context.data.namelessEndpointActionsCount++;
        }
      } else {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node, context);
        result.parameters = childResult;
      }

      return [nextNode, result];
    },

    finalize(context, result) {
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
  const names = new Map([
    [NamelessResourceHeaderRegex, 'NamelessResource'],
    [NamedResourceHeaderRegex, 'NamedResource'],
    [NamelessEndpointHeaderRegex, 'NamelessEndpoint'],
    [NamedEndpointHeaderRegex, 'NamedEndpoint'],
  ]);

  return [
    NamelessResourceHeaderRegex,
    NamedResourceHeaderRegex,
    NamelessEndpointHeaderRegex,
    NamedEndpointHeaderRegex,
  ].reduce((acc, regx) => (regx.test(subject) ? [names.get(regx), regx.exec(subject)] : acc), []);
}
