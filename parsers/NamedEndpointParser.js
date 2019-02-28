const SectionTypes = require('../SectionTypes');
const RegExpStrings = require('../RegExpStrings');
const utils = require('../utils');

const NamedEndpointHeaderRegex = new RegExp(`^${RegExpStrings.symbolIdentifier}\\s+\\[${RegExpStrings.requestMethods}\\s+${RegExpStrings.uriTemplate}](\\s+${RegExpStrings.resourcePrototype})?$`);

module.exports = (Parsers) => {
  Parsers.NamedEndpointParser = Object.assign(
    Object.create(require('./AbstractParser')),
    Parsers.ResourceParser,
    {
      allowLeavingNode: false,

      sectionType(node, context) {
        if (node.type === 'heading') {
          const subject = utils.headerText(node, context.sourceLines);

          if (NamedEndpointHeaderRegex.exec(subject)) {
            return SectionTypes.namedAction;
          }
        }

        return SectionTypes.undefined;
      },
    },
  );
  return true;
};
