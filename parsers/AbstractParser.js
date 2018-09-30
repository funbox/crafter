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
  allowLeavingNode: true,

  parse(node, context) {
    let result;
    const oldRootNode = context.rootNode;
    context.rootNode = node;
    let curNode = node;

    [curNode, result] = this.processSignature(curNode, context);

    if (this.allowLeavingNode || this.isCurrentNodeOrChild(curNode, context.rootNode)) {
      [curNode, result] = this.processDescription(curNode, context, result);

      if (this.allowLeavingNode || this.isCurrentNodeOrChild(curNode, context.rootNode)) {
        [curNode, result] = this.processNestedSections(curNode, context, result);
      }
    }

    result = this.finalize(context, result);

    context.rootNode = oldRootNode;
    return [curNode, result];
  },

  processSignature(node, context, result) { // eslint-disable-line no-unused-vars
    throw new Error('Not Implemented');
  },

  processDescription(node, context, result) {
    let [curNode, description] = utils.extractDescription(node, context.sourceLines);

    let fullDescription = '';

    if (description) {
      fullDescription+= description;
    }

    while (curNode && this.isDescriptionNode(curNode, context)) {
      if (fullDescription) {
        fullDescription = utils.twoNewLines(fullDescription);
      }

      fullDescription += utils.nodeText(curNode, context.sourceLines);

      curNode = utils.nextNode(curNode);
    }

    if (fullDescription) {
      result.description = new DescriptionElement(fullDescription);
    }

    return [curNode, result];
  },

  processNestedSections(node, context, result) {
    let curNode = node;

    while (curNode) {
      if (this.nestedSectionType(curNode, context) !== SectionTypes.undefined) {
        if ((this.allowLeavingNode || this.isCurrentNodeOrChild(curNode, context.rootNode))) {
          [curNode, result] = this.processNestedSection(curNode, context, result);
        } else {
          break;
        }
      } else {
        if (this.isUnexpectedNode(curNode, context)) {
          console.log('ignoring unrecognized block ', utils.nodeText(curNode, context.sourceLines));
          curNode = utils.nextNode(curNode);
        } else {
          break;
        }
      }
    }

    return [curNode, result];
  },

  processNestedSection(node, context, result) { // eslint-disable-line no-unused-vars
    throw new Error('Not Implemented');
  },

  sectionType(node, context) { // eslint-disable-line no-unused-vars
    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) { // eslint-disable-line no-unused-vars
    return SectionTypes.undefined;
  },

  upperSectionType(node, context) { // eslint-disable-line no-unused-vars
    return SectionTypes.undefined;
  },

  finalize(context, result) {
    return result;
  },

  isCurrentNodeOrChild(node, rootNode) {
    while (node) {
      if (node === rootNode) {
        return true;
      }

      node = node.parent;
    }

    return false;
  },

  isDescriptionNode(node, context) {
    return this.nestedSectionType(node, context) === SectionTypes.undefined &&
      this.upperSectionType(node, context) === SectionTypes.undefined;
  },

  isUnexpectedNode(node, context) {
    return context.sectionKeywordSignature(node) === SectionTypes.undefined;
  }
};
