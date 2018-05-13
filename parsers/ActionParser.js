const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const actionSymbolIdentifier = "(.+)";

/** Nameless action matching regex */
const ActionHeaderRegex = new RegExp(`^${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?(\\s+${RegExpStrings.resourcePrototype})?$`);

/** Named action matching regex */
const NamedActionHeaderRegex = new RegExp(`^${actionSymbolIdentifier}\\[${RegExpStrings.requestMethods}\\s*${RegExpStrings.uriTemplate}?\](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = {
  parse(node, context) {
    const result = {
      element: Refract.elements.transition,
      meta: {
        title: ''
      },
      content: [],
    };

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

    let curNode = node.next;
    [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

    if (description) {
      result.content.push({
        element: Refract.elements.copy,
        content: description,
      });
    }

    return [curNode, result];
  },
  sectionType(node, context) {
    if (node.type === 'heading') {
      const subject = utils.headerText(node, context.sourceLines);

      if (ActionHeaderRegex.exec(subject) || NamedActionHeaderRegex.exec(subject)) {
        return SectionTypes.action;
      }
    }

    return SectionTypes.undefined;
  }
};