const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const ResourcePrototypeParser = require('./ResourcePrototypeParser');

const ResourcePrototypesRegex = /^[Rr]esource\s+[Pp]rototypes$/;

module.exports = {
  parse(node, context) {
    const result = {
      element: Refract.elements.category,
      meta: {
        classes: [Refract.categoryClasses.resourcePrototypes],
      },
      content: [],
    };

    let curNode = node.next;
    let childResult;

    while (curNode && ResourcePrototypeParser.sectionType(curNode, context) !== SectionTypes.undefined) {
      [curNode, childResult] = ResourcePrototypeParser.parse(curNode, context);
      result.content.push(childResult);
    }

    return [curNode, result];
  },
  sectionType(node, context) {
    if (node.type === 'heading') {
      const subject = utils.headerText(node, context.sourceLines);

      if (ResourcePrototypesRegex.exec(subject))
        return SectionTypes.resourcePrototypes;
    }

    return SectionTypes.undefined;
  }
};