const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utilsHelpers = require('../utils/index');
const ActionElement = require('./elements/ActionElement');

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
      let protoNamesOffset = 0;

      context.pushFrame();

      const [subject, subjectOffset] = utilsHelpers.headerTextWithOffset(node, context.sourceLines);

      const sourceMap = utilsHelpers.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      context.data.actionSignatureDetails = { sourceMap };

      const actionHeaderMatchResult = utilsHelpers.matchStringToRegex(subject, ActionHeaderRegex);
      if (actionHeaderMatchResult) {
        const [matchData, matchDataIndexes] = actionHeaderMatchResult;

        if (matchData[2]) {
          const hrefString = matchData[2].trim();
          href = utilsHelpers.makeStringElement(
            hrefString,
            subjectOffset + subject.indexOf(hrefString, matchDataIndexes[2]),
            node,
            context,
          );
        }

        if (matchData[4]) {
          protoNames = matchData[4];
          protoNamesOffset = matchDataIndexes[4];
        }

        method = utilsHelpers.makeStringElement(matchData[1], subjectOffset + matchDataIndexes[1], node, context);
      } else {
        const [matchData, matchDataIndexes] = utilsHelpers.matchStringToRegex(subject, NamedActionHeaderRegex);

        const titleString = matchData[1].trim();

        if (titleString) {
          title = utilsHelpers.makeStringElement(
            titleString,
            subjectOffset + subject.indexOf(titleString, matchDataIndexes[1]),
            node,
            context,
          );
        }


        if (matchData[3]) {
          const hrefString = matchData[3].trim();
          href = utilsHelpers.makeStringElement(
            hrefString,
            subjectOffset + subject.indexOf(hrefString, matchDataIndexes[3]),
            node,
            context,
          );
        }

        if (matchData[5]) {
          protoNames = matchData[5];
          protoNamesOffset = matchDataIndexes[5];
        }

        method = utilsHelpers.makeStringElement(matchData[2], subjectOffset + matchDataIndexes[2], node, context);
      }

      const protoElements = utilsHelpers.buildPrototypeElements(protoNames, subjectOffset + protoNamesOffset, node, context);
      context.resourcePrototypes.push(utilsHelpers.preparePrototypes(protoElements.map(el => el.string), context, sourceMap));

      const result = new ActionElement(method, href, title, protoElements, sourceMap);

      return [utilsHelpers.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node && node.type === 'heading') {
        const subject = utilsHelpers.headerText(node, context.sourceLines);

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

      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      result.sourceMap = utilsHelpers.concatSourceMaps([result.sourceMap, childResult.sourceMap], sourceBuffer, linefeedOffsets);

      return [nextNode, result];
    },

    finalize(context, result) {
      const sourceBuffer = context.rootNode.sourceBuffer || context.sourceBuffer;
      const linefeedOffsets = context.rootNode.linefeedOffsets || context.linefeedOffsets;
      const unrecognizedBlocksSourceMaps = result.unrecognizedBlocks.map(ub => ub.sourceMap);
      result.sourceMap = utilsHelpers.concatSourceMaps([result.sourceMap, ...unrecognizedBlocksSourceMaps], sourceBuffer, linefeedOffsets);

      if (result.description) {
        result.sourceMap = utilsHelpers.concatSourceMaps([result.sourceMap, result.description.sourceMap], sourceBuffer, linefeedOffsets);
      }

      const { actionSignatureDetails: details } = context.data;
      const registeredProtos = context.resourcePrototypeResolver.prototypes;
      const resourcePrototypesChain = context.resourcePrototypes.reduce((res, el) => res.concat(el), []);
      [...new Set(resourcePrototypesChain)].forEach((pName) => {
        const p = registeredProtos[pName];
        result.responses.push(...p.responses);
      });

      if (!(result.responses.length > 0)) {
        context.addWarning('Action is missing a response', details.sourceMap);
      }

      context.resourcePrototypes.pop();
      context.popFrame();

      const { href, parameters } = result;
      if (href) {
        let expectedParameters;

        try {
          expectedParameters = getUriVariables(href.string);
        } catch (e) {
          throw new utilsHelpers.CrafterError(`Could not retrieve URI parameters: ${href.string}`, details.sourceMap);
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
