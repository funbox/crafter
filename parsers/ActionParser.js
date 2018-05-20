const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const ParametersParser = require('./ParametersParser');
const ResponseParser = require('./ResponseParser');

const actionSymbolIdentifier = "(.+)";

/** Nameless action matching regex */
const ActionHeaderRegex = new RegExp(`^${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?(\\s+${RegExpStrings.resourcePrototype})?$`);

/** Named action matching regex */
const NamedActionHeaderRegex = new RegExp(`^${actionSymbolIdentifier}\\[${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?\](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    context.pushFrame();

    context.data.responses = [];

    result.element = Refract.elements.transition;
    result.meta = { title: '' };

    const subject = utils.headerText(node, context.sourceLines);
    let matchData;

    if (matchData = ActionHeaderRegex.exec(subject)) {
      if (matchData[2]) {
        result.attributes = {href: matchData[2].trim()};
      }
    } else if (matchData = NamedActionHeaderRegex.exec(subject)) {
      result.meta.title = matchData[1].trim();

      if (matchData[3]) {
        result.attributes = {href: matchData[3].trim()};
      }
    }

    return utils.nextNode(node);
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
    if (node.type === 'list') {
      node = node.firstChild;
    }

    // TODO: Может быть для списка сразу брать первый элемент прямо в AbstractParser?
    return SectionTypes.calculateSectionType(node, context, [
      ParametersParser,
      ResponseParser,
    ]);
  },

  processNestedSection(node, context, result) {
    if (node.type === 'list') {
      node = node.firstChild;
    }

    let nextNode, childResult;

    if (ParametersParser.sectionType(node, context) !== SectionTypes.undefined) {
      [nextNode, childResult] = ParametersParser.parse(node, context);
      result.attributes.hrefVariables = childResult;
    } else {
      [nextNode, childResult] = ResponseParser.parse(node, context);
      context.data.responses.push(childResult);
    }

    return nextNode;
  },

  finalize(context, result) {
    context.data.responses.forEach(resp => {
      result.content.push({
        element: Refract.elements.httpTransaction,
        content: [
          resp
        ]
      });
    });

    context.popFrame();
  }
});