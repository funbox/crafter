const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const Refract = require('../Refract');
const utils = require('../utils');

const actionSymbolIdentifier = "(.+)";

/** Nameless action matching regex */
const ActionHeaderRegex = new RegExp(`^${RegExpStrings.requestMethods}\\\\s*${RegExpStrings.uriTemplate}?(\\\\s+${RegExpStrings.resourcePrototype})?$`);

/** Named action matching regex */
const NamedActionHeaderRegex = new RegExp(`^${actionSymbolIdentifier}\\[${RegExpStrings.requestMethods}\\\\s*${RegExpStrings.uriTemplate}?](\\\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = {
  parse(node, context) {
    const result = {
      element: Refract.elements.resource,
      meta: {
        title: ''
      },
      attributes: {
        href: ''
      },
      content: [],
    };

    return [node.next, result];
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