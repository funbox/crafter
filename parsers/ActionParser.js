const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ActionElement = require('./elements/ActionElement');
const StringElement = require('./elements/StringElement');

const actionSymbolIdentifier = '(.+)';

/** Nameless action matching regex */
const ActionHeaderRegex = new RegExp(`^${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?(\\s+${RegExpStrings.resourcePrototype})?$`);

/** Named action matching regex */
const NamedActionHeaderRegex = new RegExp(`^${actionSymbolIdentifier}\\[${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ActionParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title = null;
      let href = null;
      let method = null;
      let protoNames = '';

      context.pushFrame();

      const [subject, subjectOffset] = utils.headerText(node, context.sourceLines);

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.actionSignatureDetails = { sourceMap };

      const actionHeaderMatchResult = utils.matchStringToRegex(subject, ActionHeaderRegex);
      if (actionHeaderMatchResult) {
        const [matchData, matchDataIndexes] = actionHeaderMatchResult;

        if (matchData[2]) {
          const hrefString = matchData[2].trim();
          const hrefSourceMap = utils.makeSourceMapsForString(
            hrefString,
            subjectOffset + subject.indexOf(hrefString, matchDataIndexes[2]),
            node,
            context.sourceLines,
            context.sourceBuffer,
            context.linefeedOffsets,
          );
          href = new StringElement(hrefString, hrefSourceMap);
        }

        if (matchData[4]) {
          protoNames = matchData[4];
        }

        const methodString = matchData[1];
        const methodSourceMap = utils.makeSourceMapsForString(
          methodString,
          subjectOffset + matchDataIndexes[1],
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        );
        method = new StringElement(methodString, methodSourceMap);
      } else {
        const [matchData, matchDataIndexes] = utils.matchStringToRegex(subject, NamedActionHeaderRegex);

        const titleString = matchData[1].trim();

        if (titleString) {
          const titleSourceMap = utils.makeSourceMapsForString(
            titleString,
            subjectOffset + subject.indexOf(titleString, matchDataIndexes[1]),
            node,
            context.sourceLines,
            context.sourceBuffer,
            context.linefeedOffsets,
          );
          title = new StringElement(titleString, titleSourceMap);
        }


        if (matchData[3]) {
          const hrefString = matchData[3].trim();
          const hrefSourceMap = utils.makeSourceMapsForString(
            hrefString,
            subjectOffset + subject.indexOf(hrefString, matchDataIndexes[3]),
            node,
            context.sourceLines,
            context.sourceBuffer,
            context.linefeedOffsets,
          );
          href = new StringElement(hrefString, hrefSourceMap);
        }

        if (matchData[5]) {
          protoNames = matchData[5];
        }

        const methodString = matchData[2];
        const methodSourceMap = utils.makeSourceMapsForString(
          methodString,
          subjectOffset + matchDataIndexes[2],
          node,
          context.sourceLines,
          context.sourceBuffer,
          context.linefeedOffsets,
        );
        method = new StringElement(methodString, methodSourceMap);
      }

      const prototypes = protoNames ? protoNames.split(',').map(p => p.trim()) : [];

      prototypes.forEach(prototype => {
        if (!context.resourcePrototypeResolver.prototypes[prototype]) {
          throw new utils.CrafterError(`Unknown resource prototype "${prototype}"`, sourceMap);
        }
      });

      context.resourcePrototypes.push(prototypes);

      const result = new ActionElement(method, href, title);
      result.sourceMap = sourceMap;

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node && node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines)[0];

        if (ActionHeaderRegex.exec(subject) || NamedActionHeaderRegex.exec(subject)) {
          return SectionTypes.action;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ParametersParser,
        Parsers.RequestParser,
        Parsers.ResponseParser,
      ]);
    },

    upperSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.ActionParser,
        Parsers.ResourceParser,
        Parsers.ResourceGroupParser,
        Parsers.SubgroupParser,
        Parsers.MessageParser,
        Parsers.DataStructureGroupParser,
        Parsers.SchemaStructureGroupParser,
        Parsers.ResourcePrototypesParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childResult;

      if (Parsers.ParametersParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.ParametersParser.parse(node, context);
        result.parameters = childResult;
      } else if (Parsers.RequestParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childResult] = Parsers.RequestParser.parse(node, context);
        childResult.method = result.method;
        result.requests.push(childResult);
      } else {
        [nextNode, childResult] = Parsers.ResponseParser.parse(node, context);
        result.responses.push(childResult);
      }

      result.sourceMap = utils.mergeSourceMaps([result.sourceMap, childResult.sourceMap], context.sourceBuffer, context.linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      if (result.description) {
        result.sourceMap = utils.mergeSourceMaps([result.sourceMap, result.description.sourceMap], context.sourceBuffer, context.linefeedOffsets);
      }

      const { actionSignatureDetails: details } = context.data;
      const registeredProtos = context.resourcePrototypeResolver.prototypes;
      const resourcePrototypesChain = context.resourcePrototypes.reduce((res, el) => res.concat(el), []);
      [...new Set(resourcePrototypesChain)].forEach((pName) => {
        const p = registeredProtos[pName];
        result.responses.push(...p.responses);
      });

      if (!(result.responses.length > 0)) {
        context.addWarning('Аction is missing a response', details.sourceMap);
      }

      context.resourcePrototypes.pop();
      context.popFrame();

      const { href, parameters } = result;
      if (href) {
        let expectedParameters;

        try {
          expectedParameters = getUriVariables(href.string);
        } catch (e) {
          throw new utils.CrafterError(`Could not retrieve URI parameters: ${href.string}`, details.sourceMap);
        }

        if (parameters && parameters.parameters) {
          expectedParameters = expectedParameters.filter(name => !parameters.parameters.find(p => p.name.string === name));
        }

        if (expectedParameters.length > 0) {
          context.addWarning(`Action is missing parameter definitions: ${expectedParameters.join(', ')}.`, details.sourceMap);
        }
      }

      return result;
    },
  });
  return true;
};

function getUriVariables(uriTemplate) {
  const URI_VARIABLE_REGEX = /{(.*?)}/g;
  const URI_TEMPLATE_EXPRESSION_REGEX = /^(?:[?|&]?(((?:[A-Za-z0-9_])+|(?:%[A-Fa-f0-9]{2})+)+)\*?)$/;

  const result = [];

  let match = URI_VARIABLE_REGEX.exec(uriTemplate);

  while (match) {
    const names = match[1].split(',');
    const cleanNames = names.map(str => URI_TEMPLATE_EXPRESSION_REGEX.exec(str)[1]);

    result.push(...cleanNames);

    match = URI_VARIABLE_REGEX.exec(uriTemplate);
  }

  return result;
}
