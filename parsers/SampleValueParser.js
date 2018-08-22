const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const SignatureParser = require('../SignatureParser');
const SampleValueElement = require('./elements/SampleValueElement');

const sampleValueRegex = /^[Ss]ample:?\s*`?(.+?)`?$/;
const listTypedSampleValueRegex = /^[Ss]ample$/;

module.exports = (Parsers) => {
  Parsers.SampleValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const val = sampleValueRegex.exec(text);
      const sampleValueElement = new SampleValueElement((val && val[1]) || undefined);
      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), sampleValueElement];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (sampleValueRegex.exec(text) || listTypedSampleValueRegex.exec(text)) {
          return SectionTypes.sampleValue;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      if (node.type === 'item' && this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return SectionTypes.msonAttribute;
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const member = new SignatureParser(text);
      result.members.push(member.name);

      return [utils.nextNode(node), result];
    },
  });
};
