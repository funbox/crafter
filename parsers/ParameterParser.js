const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const ParameterElement = require('./elements/ParameterElement');
const { parser: SignatureParser } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ParameterParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text);

      const result = new ParameterElement(
        signature.name,
        signature.value,
        signature.type,
        signature.typeAttributes,
        signature.description,
      );

      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') { // TODO: вынести проверку node.type в AbstractParser
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (signature.attributes.length <= 2) {
            return SectionTypes.parameter;
          }
        } catch (e) { // eslint-disable-line no-empty
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node, context) {
      return SectionTypes.calculateSectionType(node, context, [
        Parsers.DefaultValueParser,
        Parsers.ParameterMembersParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childRes;

      if (Parsers.DefaultValueParser.sectionType(node, context) !== SectionTypes.undefined) {
        [nextNode, childRes] = Parsers.DefaultValueParser.parse(node, context);
        result.defaultValue = childRes;
      } else {
        [nextNode, childRes] = Parsers.ParameterMembersParser.parse(node, context);
        result.enumerations = childRes;
      }

      return [nextNode, result];
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { name, typeAttributes, defaultValue } = result;
      if (typeAttributes.includes('required')) {
        if (typeAttributes.includes('optional')) {
          throw new utils.CrafterError(`Parameter "${name}" must not be specified as both required and optional.`);
        }

        if (defaultValue) {
          context.logger.warn(`Specifying parameter ${name} as required supersedes its default value, declare the parameter as 'optional' to specify its default value.`);
        }
      }

      return result;
    },
  });
};
