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

      const subject = utils.headerText(node, context.sourceLines);
      let matchData;

      if (matchData = ResourceHeaderRegex.exec(subject)) {
        href = matchData[3];
      } else if (matchData = NamedEndpointHeaderRegex.exec(subject)) {
        title = matchData[1];
        href = matchData[3];

        const result = new ResourceElement(title, href);
        const [nextNode, childResult] = Parsers.ActionParser.parse(node, context);
        result.actions.push(childResult);
        return [nextNode, result];
      } else {
        matchData = NamedResourceHeaderRegex.exec(subject);
        title = matchData[1];
        href = matchData[2];
      }

      const result = new ResourceElement(title, href);
      return [utils.nextNode(node), result];
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
      const actionSectionType = Parsers.ActionParser.sectionType(node, context);

      if (actionSectionType !== SectionTypes.undefined) return actionSectionType;

      return Parsers.ParametersParser.sectionType(node, context);
    },

    processNestedSection(node, context, result) {
      let nextNode, childResult;

      if (this.nestedSectionType(node, context) === SectionTypes.action) {
        [nextNode, childResult] = Parsers.ActionParser.parse(node, context);
        result.actions.push(childResult);
      } else {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node.firstChild, context);
        result.parameters = childResult;
      }

      return [nextNode, result];
    }
  });
};