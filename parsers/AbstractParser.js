const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const Refract = require('../Refract');

module.exports = {
  parse(node, context) {
    const result = {
      element: null,
      content: [],
    };

    let curNode = node;

    curNode = this.processSignature(curNode, context, result);
    curNode = this.processDescription(curNode, context, result);

    let childResult;

    while (curNode && this.nestedSectionType(curNode, context) !== SectionTypes.undefined) {
      [curNode, childResult] = this.processNestedSection(curNode, context);
      result.content.push(childResult);
    }

    return [curNode, result];
  },

  processSignature(node, context, result) {
    throw new Error('Not Implemented');
  },

  processDescription(node, context, result) {
    let curNode = node;
    [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

    if (description) {
      result.content.push({
        element: Refract.elements.copy,
        content: description,
      });
    }

    return curNode;
  },

  processNestedSection(node, context) {
    throw new Error('Not Implemented');
  },

  sectionType(node, context) {
    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) {
    return SectionTypes.undefined;
  }
};