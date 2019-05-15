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
      let protoNames = '';
      let nodeToReturn = node;

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
          href = matchData[3];
          protoNames = matchData[5];
          break;
        case 'NamedEndpoint':
          title = matchData[1];
          href = matchData[3];
          isNamedEndpoint = true;
          break;
        default:
          break;
      }

      const prototypes = protoNames ? protoNames.split(',').map(p => p.trim()) : [];
      context.resourcePrototypes.push(prototypes);

      const titleEl = new StringElement(title);
      const hrefEl = new StringElement(href);

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
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
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ActionParser,
        Parsers.ParametersParser,
      ]);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.DataStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      if (this.nestedSectionType(node, context) === SectionTypes.action) {
        [nextNode, childResult] = Parsers.ActionParser.parse(node, context);
        result.actions.push(childResult);
      } else {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node, context);
        result.parameters = childResult;
      }

      return [nextNode, result];
    },

    finalize(context, result) {
      context.resourcePrototypes.pop(); // очищаем стек с прототипами данного ресурса
      return result;
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
