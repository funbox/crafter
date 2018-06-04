const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const Refract = require('../Refract');

class DescriptionElement {
  constructor(description) {
    this.description = description;
  }

  toRefract() {
    return {
      element: Refract.elements.copy,
      content: this.description,
    };
  }
}

module.exports = {
  parse(node, context) {
    let result;
    let curNode = node;

    [curNode, result] = this.processSignature(curNode, context);
    [curNode, result] = this.processDescription(curNode, context, result);
    [curNode, result] = this.processNestedSections(curNode, context, result);

    result = this.finalize(context, result);

    return [curNode, result];
  },

  processSignature(node, context, result) {
    throw new Error('Not Implemented');
  },

  processDescription(node, context, result) {
    let curNode = node;
    [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

    if (description) {
      result.content.push(new DescriptionElement(description));
    }

    return [curNode, result];
  },

  processNestedSections(node, context, result) {
    let childResult;
    let curNode = node;

    while (curNode && this.nestedSectionType(curNode, context) !== SectionTypes.undefined) {
      [curNode, result] = this.processNestedSection(curNode, context, result);
    }

    return [curNode, result];
  },

  processNestedSection(node, context, result) {
    throw new Error('Not Implemented');
  },

  sectionType(node, context) {
    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) {
    return SectionTypes.undefined;
  },

  finalize(context, result) {
    return result;
  }
};