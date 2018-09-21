const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ResourceElement = require('./elements/ResourceElement');

const ResourceHeaderRegex = new RegExp(`^(${RegExpStrings.requestMethods}\\s+)?${RegExpStrings.uriTemplate}(\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedResourceHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedEndpointHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.requestMethods}\\s+${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title = '';
      let href = '';
      let protoNames = '';
      let nodeToReturn = node;

      const subject = utils.headerText(node, context.sourceLines);

      let matchData = ResourceHeaderRegex.exec(subject);
      if (matchData) {
        href = matchData[3];
        protoNames = matchData[5];
      } else {
        matchData = NamedEndpointHeaderRegex.exec(subject);
        if (matchData) {
          title = matchData[1];
          href = matchData[3];
          protoNames = matchData[5];
        } else {
          matchData = NamedResourceHeaderRegex.exec(subject);
          title = matchData[1];
          href = matchData[2];
          protoNames = matchData[4];
          nodeToReturn = utils.nextNode(node);
        }
      }

      const prototypes = protoNames ? protoNames.split(',').map(p => p.trim()) : [];
      context.resourcePrototypes.push(prototypes);

      const result = new ResourceElement(title, href);
      return [nodeToReturn, result];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

        if (ResourceHeaderRegex.exec(subject) || NamedResourceHeaderRegex.exec(subject) || NamedEndpointHeaderRegex.exec(subject)) {
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
};
