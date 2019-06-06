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
      let title = '';
      let href = '';
      let method = '';
      let protoNames = '';

      context.pushFrame();

      const subject = utils.headerText(node, context.sourceLines);

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.actionSignatureDetails = { sourceMap };

      let matchData = ActionHeaderRegex.exec(subject);
      if (matchData) {
        if (matchData[2]) {
          href = matchData[2].trim();
        }

        if (matchData[4]) {
          protoNames = matchData[4];
        }

        method = matchData[1];
      } else {
        matchData = NamedActionHeaderRegex.exec(subject);
        if (matchData) {
          title = matchData[1].trim();

          if (matchData[3]) {
            href = matchData[3].trim();
          }

          if (matchData[5]) {
            protoNames = matchData[5];
          }

          method = matchData[2];
        }
      }

      const prototypes = protoNames ? protoNames.split(',').map(p => p.trim()) : [];
      context.resourcePrototypes.push(prototypes);

      const methodEl = new StringElement(method);
      methodEl.sourceMap = sourceMap;
      const result = new ActionElement(title, href, methodEl);
      result.sourceMap = sourceMap;

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node && node.type === 'heading') {
        const subject = utils.headerText(node, context.sourceLines);

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

      return [nextNode, result];
    },

    finalize(context, result) {
      const { actionSignatureDetails: details } = context.data;
      const registeredProtos = context.resourcePrototypeResolver.prototypes;
      const resourcePrototypesChain = context.resourcePrototypes.reduce((res, el) => res.concat(el), []);
      [...new Set(resourcePrototypesChain)].forEach((pName) => {
        const p = registeredProtos[pName];
        result.responses.push(...p.responses.map((response) => {
          response.sourceMap = null;
          return response;
        }));
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
          expectedParameters = getUriVariables(href);
        } catch (e) {
          throw new utils.CrafterError(`Could not retrieve URI parameters: ${href}`, details.sourceMap);
        }

        if (parameters && parameters.parameters) {
          expectedParameters = expectedParameters.filter(name => !parameters.parameters.find(p => p.name === name.replace(/\*$/, '')));
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
