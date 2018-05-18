const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const ResourcePrototypeParser = require('./ResourcePrototypeParser');

const ResourcePrototypesRegex = /^[Rr]esource\s+[Pp]rototypes$/;

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    result.element = Refract.elements.category;
    result.meta = {
      classes: [Refract.categoryClasses.resourcePrototypes],
    };

    return node.next;
  },

  sectionType(node, context) {
    if (node.type === 'heading') {
      const subject = utils.headerText(node, context.sourceLines);

      if (ResourcePrototypesRegex.exec(subject))
        return SectionTypes.resourcePrototypes;
    }

    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) {
    return ResourcePrototypeParser.sectionType(node, context);
  },

  processNestedSection(node, context, result) {
    const [nextNode, childResult] = ResourcePrototypeParser.parse(node, context);
    result.content.push(childResult);
    return nextNode;
  },

  processDescription(node) {
    return node;
  }
});