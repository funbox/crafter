const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');
const ActionElement = require('./elements/ActionElement');

const actionSymbolIdentifier = "(.+)";

/** Nameless action matching regex */
const ActionHeaderRegex = new RegExp(`^${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?(\\s+${RegExpStrings.resourcePrototype})?$`);

/** Named action matching regex */
const NamedActionHeaderRegex = new RegExp(`^${actionSymbolIdentifier}\\[${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?\](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.ActionParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      let title = '';
      let href = '';
      let method = '';
      let protoNames = '';

      const subject = utils.headerText(node, context.sourceLines);
      let matchData;

      if (matchData = ActionHeaderRegex.exec(subject)) {
        if (matchData[2]) {
          href = matchData[2].trim();
        }

        if (matchData[4]) {
          protoNames = matchData[4];
        }

        method = matchData[1];
      } else if (matchData = NamedActionHeaderRegex.exec(subject)) {
        title = matchData[1].trim();

        if (matchData[3]) {
          href = matchData[3].trim();
        }

        if (matchData[5]) {
          protoNames = matchData[5];
        }

        method = matchData[2];
      }

      const prototypes = protoNames ? protoNames.split(',').map(p => p.trim()) : [];
      context.resourcePrototypes.push(prototypes);
      const result = new ActionElement(title, href, method);

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'heading') {
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

    processNestedSection(node, context, result) {
      let nextNode, childResult;

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
      const registeredProtos = context.resourcePrototypeResolver.prototypes;
      const resourcePrototypesChain = context.resourcePrototypes.reduce((res, el) => res.concat(el), []);
      const uniqueProtos = [...new Set(resourcePrototypesChain)];
      const activeProtos = uniqueProtos.map(pName => {
        return registeredProtos[pName];
      });
      activeProtos.forEach(p => {
        result.responses.push(...p.responses);
      });

      context.resourcePrototypes.pop();
      return result;
    }
  });
};