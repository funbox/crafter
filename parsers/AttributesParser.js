const SectionTypes = require('../SectionTypes');
const Refract = require('../Refract');
const utils = require('../utils');

const MSONAttributeParser = require('./MSONAttributeParser');

const attributesRegex = /^[Aa]ttributes?$/;

module.exports = Object.assign(Object.create(require('./AbstractParser')), {
  processSignature(node, context, result) {
    result.element = Refract.elements.dataStructure;

    result.content = {
      element: Refract.elements.object,
      content: []
    };

    return utils.nextNode(node.firstChild);
  },

  sectionType(node, context) {
    if (node.type === 'item') {
      const text = utils.nodeText(node.firstChild, context.sourceLines).trim();
      if (attributesRegex.exec(text)) {
        return SectionTypes.attributes;
      }
    }

    return SectionTypes.undefined;
  },

  nestedSectionType(node, context) {
    return MSONAttributeParser.sectionType(node, context);
  },

  processNestedSection(node, context, result) {
    const [nextNode, childResult] = MSONAttributeParser.parse(node, context);
    result.content.content.push(childResult);
    return nextNode;
  },
});