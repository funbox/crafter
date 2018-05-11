const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const Refract = require('../Refract');

module.exports = {
  parse(node, context) {
    const result = {
      element: Refract.elements.resourcePrototype,
      content: [],
    };

    let curNode = node.next;

    [curNode, description] = utils.extractDescription(curNode, context.sourceLines);

    if (description) {
      result.content.push({
        element: Refract.elements.copy,
        content: description,
      });
    }

    if (curNode && curNode.type === 'list') {
      // Обработать содержимое прототипа
      curNode = curNode.next;
    }

    return [curNode, result];
  },

  sectionType(node, context) {
    if (node.type === 'heading' && context.sectionKeywordSignature(node) === SectionTypes.undefined) {
      return SectionTypes.resourcePrototype;
    }

    return SectionTypes.undefined;
  }
};