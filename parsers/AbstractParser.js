const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const UnrecognizedBlockElement = require('./elements/UnrecognizedBlockElement');

module.exports = {
  allowLeavingNode: true,

  parse(node, context) {
    let result;
    const oldRootNode = context.rootNode;
    context.rootNode = node;
    let curNode = node;

    [curNode, result] = this.processSignature(curNode, context);

    if (this.allowLeavingNode || utils.isCurrentNodeOrChild(curNode, context.rootNode)) {
      [curNode, result] = this.processDescription(curNode, context, result);

      if (this.allowLeavingNode || utils.isCurrentNodeOrChild(curNode, context.rootNode)) {
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
    const stopCallback = curNode => (curNode && !this.isDescriptionNode(curNode, context));

    const [curNode, descriptionEl] = utils.extractDescription(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback);

    if (descriptionEl) {
      result.description = descriptionEl;
    }

    return [curNode, result];
  },

  processNestedSections(node, context, result) {
    let curNode = node;

    while (curNode) {
      let shouldContinue = false;

      if (this.allowLeavingNode || utils.isCurrentNodeOrChild(curNode, context.rootNode)) {
        if (this.nestedSectionType(curNode, context) !== SectionTypes.undefined) {
          [curNode, result] = this.processNestedSection(curNode, context, result);
          shouldContinue = true;
        } else if (this.isUnexpectedNode(curNode, context)) {
          const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
          result.unrecognizedBlocks.push(new UnrecognizedBlockElement(sourceMap));
          context.addWarning(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, sourceMap);
          curNode = utils.nextNode(curNode);
          shouldContinue = true;
        }
      }

      if (!shouldContinue) break;
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

  isDescriptionNode(node, context) {
    return this.nestedSectionType(node, context) === SectionTypes.undefined
      && this.upperSectionType(node, context) === SectionTypes.undefined;
  },

  isUnexpectedNode(node, context) {
    return this.upperSectionType(node, context) === SectionTypes.undefined;
  },
};
