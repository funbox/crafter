const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const utilsHelpers = require('../utils/index');
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
      let protoNamesOffset = 0;
      let nodeToReturn = node;

      context.pushFrame();

      const [subject, subjectOffset] = utils.headerTextWithOffset(node, context.sourceLines);
      const [sectionType, [matchData, matchDataIndexes]] = getSectionType(subject);

      switch (sectionType) {
        case 'NamedResource':
          title = utilsHelpers.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
          href = utilsHelpers.makeStringElement(matchData[2], subjectOffset + matchDataIndexes[2], node, context);

          protoNames = matchData[4];
          protoNamesOffset = matchDataIndexes[4];
          nodeToReturn = utilsHelpers.nextNode(node);
          break;
        case 'NamelessResource':
          href = utilsHelpers.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);

          protoNames = matchData[3];
          protoNamesOffset = matchDataIndexes[3];
          nodeToReturn = utilsHelpers.nextNode(node);
          break;
        case 'NamelessEndpoint':
          method = matchData[2];
          href = utilsHelpers.makeStringElement(matchData[3], subjectOffset + matchDataIndexes[3], node, context);
          protoNames = matchData[5];
          protoNamesOffset = matchDataIndexes[5];
          context.data.endpointActionsCount = 0;
          break;
        case 'NamedEndpoint':
          title = utilsHelpers.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
          method = matchData[2];
          href = utilsHelpers.makeStringElement(matchData[3], subjectOffset + matchDataIndexes[3], node, context);
          context.data.endpointActionsCount = 0;
          break;
        default:
          break;
      }

      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      const protoElements = utilsHelpers.buildPrototypeElements(protoNames, subjectOffset + protoNamesOffset, node, context);
      context.resourcePrototypes.push(utilsHelpers.preparePrototypes(protoElements.map(el => el.string), context, sourceMap));

      context.data.resourceEndpointMethod = method;
      context.data.startNode = node;

      const result = new ResourceElement(href, title, protoElements, sourceMap);

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

        this.checkForActionDuplicates(result, childResult, context);

        result.actions.push(childResult);

        if (Object.keys(context.data).includes('endpointActionsCount')) {
          context.data.endpointActionsCount++;
        }
      } else {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node, context);
        result.parameters = childResult;
      }

      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);

      if (result.description) {
        result.sourceMap = utilsHelpers.mergeSourceMaps([result.sourceMap, result.description.sourceMap], sourceBuffer, linefeedOffsets);
      }

      result.sourceMap = utils.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps], sourceBuffer, linefeedOffsets);

      context.resourcePrototypes.pop(); // очищаем стек с прототипами данного ресурса
      context.popFrame();

      return result;
    },

    checkForActionDuplicates(resource, action, context) {
      const getActionString = (method, href, parameters) => {
        let actionHref = href.string;

        if (!parameters) return `${method.string} ${actionHref}`;

        const actionUriArray = actionHref.split('{');
        let actionRequiredParams = parameters.parameters
          .filter(p => p.typeAttributes.some(attr => attr.string === 'required'))
          .map(p => p.name.string)
          .sort();

        if (actionUriArray.length === 1 || actionUriArray[actionUriArray.length - 1].includes('/')) {
          return `${method.string} ${actionHref}`;
        }

        const actionUri = actionUriArray.slice(0, -1).join('{');
        const actionUriParams = actionUri.match(/{([^}]+)}/g);

        if (actionUriParams) {
          const actionUriValues = actionUriParams.map(p => p.replace(/{|}/g, ''));
          actionRequiredParams = actionRequiredParams.filter(p => !actionUriValues.includes(p));
        }

        const actionRequiredParamsString = actionRequiredParams.join(',');

        actionHref = actionRequiredParamsString ? `${actionUri}{?${actionRequiredParamsString}}` : actionUri;

        return `${method.string} ${actionHref}`;
      };

      const method = action.method;
      const href = action.href || resource.href;
      const parameters = action.parameters || resource.parameters;

      const actionString = getActionString(method, href, parameters);

      if (!context.checkActionExists(actionString)) {
        context.addAction(actionString);
      } else {
        context.addWarning(`Action "${actionString}" already defined.`, action.sourceMap);
      }
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
    const matchResult = utilsHelpers.matchStringToRegex(subject, re);
    if (matchResult) return [name, matchResult];
  }

  return null;
}
