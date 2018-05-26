const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const ResourceHeaderRegex = new RegExp(`^(${RegExpStrings.requestMethods}\\s+)?${RegExpStrings.uriTemplate}(\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedResourceHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);
const NamedEndpointHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.requestMethods}\\s+${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ResourceParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context, result) {
      result.element = Refract.elements.resource;
      result.meta = {title: ''};
      result.attributes = {};

      const subject = utils.headerText(node, context.sourceLines);
      let matchData;

      if (matchData = ResourceHeaderRegex.exec(subject)) {
        result.attributes.href = matchData[3];
      } else if (matchData = NamedEndpointHeaderRegex.exec(subject)) {
        result.meta.title = matchData[1];
        result.attributes.href = matchData[3];
        const [nextNode, childResult] = Parsers.ActionParser.parse(node, context);
        result.content.push(childResult);
        return nextNode;
      } else {
        matchData = NamedResourceHeaderRegex.exec(subject);
        result.meta.title = matchData[1];
        result.attributes.href = matchData[2];
      }

      return utils.nextNode(node);
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
        result.content.push(childResult);
      } else {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node.firstChild, context);
        result.attributes.hrefVariables = childResult;
      }

      return nextNode;
    }
  });
};