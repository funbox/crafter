const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const DescriptionElement = require('./elements/DescriptionElement');

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
    const descriptionResult = utils.extractDescription(node, context.sourceLines, context.sourceMapsEnabled);
    let curNode = descriptionResult[0];
    let descriptionEl = descriptionResult[1];

    if (!descriptionEl) {
      let fullDescription = '';

      if (curNode) {
        const startNode = curNode;
        let endNode;

        while (curNode && this.isDescriptionNode(curNode, context)) {
          if (fullDescription) {
            fullDescription = utils.appendDescriptionDelimiter(fullDescription);
          }

          fullDescription += utils.nodeText(curNode, context.sourceLines);

          endNode = curNode;
          curNode = utils.nextNode(curNode);
        }

        if (fullDescription) {
          descriptionEl = new DescriptionElement(fullDescription);
          if (context.sourceMapsEnabled) {
            descriptionEl.sourceMap = utils.makeGenericSourceMapFromStartAndEndNodes(startNode, endNode, context.sourceLines);
          }
        }
      }
    }

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
        context.logger.warn(`Ignoring unrecognized block "${utils.nodeText(curNode, context.sourceLines)}".`, utils.getDetailsForLogger(curNode));
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
