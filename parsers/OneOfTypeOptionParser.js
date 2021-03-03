const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const OneOfTypeOptionElement = require('./elements/OneOfTypeOptionElement');
const { parser: SignatureParser, traits: ParserTraits } = require('../SignatureParser');

const oneOfTypeOptionRegex = /^[Pp]roperties$/;

module.exports = (Parsers) => {
  Parsers.OneOfTypeOptionParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const signature = new SignatureParser(subject, false, [ParserTraits.NAME, ParserTraits.DESCRIPTION]);

      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      let description;
      if (signature.description) {
        description = utils.makeStringElement(signature.description, signature.descriptionOffset, node.firstChild, context);
      }

      const optionMembersList = node.firstChild.next;
      const nextNode = (optionMembersList && optionMembersList.firstChild) || utils.nextNode(node);
      return [nextNode, new OneOfTypeOptionElement([], description, sourceMap)];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, false, [ParserTraits.NAME, ParserTraits.DESCRIPTION]);
          if (oneOfTypeOptionRegex.exec(signature.name)) {
            return SectionTypes.oneOfTypeOption;
          }
        } catch (e) {
          if (!(e instanceof utils.SignatureError)) throw e;
        }
      }
      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      if (node.parent.parent && this.sectionType(node.parent.parent, context) !== SectionTypes.undefined) {
        return Parsers.MSONAttributeParser.sectionType(node, context); // TODO: непонятно, в каких условиях эта проверка не выполнится
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      if (!node) {
        return [node, result];
      }

      const [nextNode, childResult] = Parsers.MSONAttributeParser.parse(node, context);
      result.members.push(childResult);

      return [nextNode, result];
    },

    isUnexpectedNode() {
      return false;
    },
  });
  return true;
};
