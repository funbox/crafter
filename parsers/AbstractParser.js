const SectionTypes = require('../SectionTypes');
const utils = require('../utils');

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

    const [curNode, descriptionEl] = utils.extractDescription(node, context.sourceLines, stopCallback);

    if (descriptionEl) {
      result.description = descriptionEl;
    }

    return [curNode, result];
  },

  processNestedSections(node, context, result) {
    let curNode = node;

    while (curNode) {
      if (this.nestedSectionType(curNode, context) !== SectionTypes.undefined
        && (this.allowLeavingNode || utils.isCurrentNodeOrChild(curNode, context.rootNode))
      ) {
        [curNode, result] = this.processNestedSection(curNode, context, result);
      } else if (this.isUnexpectedNode(curNode, context)) {
        const sourceMap = utils.makeGenericSourceMap(curNode, context.sourceLines);
        const charBlocks = utils.getCharacterBlocksWithLineColumnInfo(sourceMap, context.sourceBuffer, context.linefeedOffsets);
        context.addWarning(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, charBlocks, sourceMap.file);
        curNode = utils.nextNode(curNode);
      } else {
        break;
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

  isDescriptionNode(node, context) {
    return this.nestedSectionType(node, context) === SectionTypes.undefined
      && this.upperSectionType(node, context) === SectionTypes.undefined;
  },

  isUnexpectedNode(node, context) {
    return this.upperSectionType(node, context) === SectionTypes.undefined;
  },
};
