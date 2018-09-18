const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const PropertyMemberElement = require('./elements/PropertyMemberElement');
const StringElement = require('./elements/StringElement');
const ValueMemberElement = require('./elements/ValueMemberElement');
const DataStructureProcessor = require('./DataStructureProcessor');
const { parser: SignatureParser } = require('../SignatureParser');

module.exports = (Parsers) => {
  // TODO Сделать обработку nestedSection
  Parsers.MSONAttributeParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const subject = utils.nodeText(node.firstChild, context.sourceLines); // TODO: часто берем text, может сделать отдельную функцию?
      const signature = new SignatureParser(subject);

      const name = new StringElement(signature.name);
      const valueEl = new ValueMemberElement(signature.type, [], signature.value, '', signature.isSample);
      if (context.sourceMapsEnabled) {
        name.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
        valueEl.sourceMap = name.sourceMap;
      }

      const result = new PropertyMemberElement(
        name,
        valueEl,
        signature.typeAttributes,
        signature.description,
      );

      const nestedNode = node.firstChild.next;

      if (nestedNode) {
        const dataStructureProcessor = new DataStructureProcessor(nestedNode, Parsers);
        dataStructureProcessor.fillValueMember(result.value, context);
      }

      return [utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node && node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          new SignatureParser(text); // eslint-disable-line no-new
          return SectionTypes.msonAttribute;
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
    },

    // TODO: Корректно парсить многострочное описание параметра
    processDescription(node, context, result) {
      return [node, result];
    },

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { name, value: { type, content } } = result;
      if (type === types.enum && !(content && content.members && content.members.length > 0)) {
        context.logger.warn(`Enum element "${name}" should include members.`);
      }

      context.checkTypeExists(result.value.rawType);

      return result;
    },
  });
};
