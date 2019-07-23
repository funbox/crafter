const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const ParameterElement = require('./elements/ParameterElement');
const ParameterMembersElement = require('./elements/ParameterMembersElement');
const StringElement = require('./elements/StringElement');
const { parser: SignatureParser } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ParameterParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text);

      context.pushFrame();

      const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      const parameterSignatureDetails = { sourceMap };

      let descriptionEl;
      if (signature.description) {
        descriptionEl = new StringElement(signature.description);
      }
      context.data.parameterSignatureDetails = parameterSignatureDetails;
      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      const result = new ParameterElement(
        signature.name,
        signature.value,
        signature.type || 'string',
        signature.typeAttributes,
        descriptionEl,
      );

      result.sourceMap = sourceMap;
      if (result.description) {
        result.description.sourceMap = utils.makeSourceMapForLine(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);
      }

      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') { // TODO: вынести проверку node.type в AbstractParser
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text);
          if (signature.typeAttributes.length <= 2) {
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
        Parsers.MSONAttributeParser,
      ]);
    },

    processNestedSection(node, context, result) {
      let nextNode;
      let childRes;

      const sectionType = SectionTypes.calculateSectionType(node, context, [
        Parsers.DefaultValueParser,
        Parsers.ParameterMembersParser,
        Parsers.MSONAttributeParser,
      ]);

      if (sectionType === SectionTypes.msonAttribute && result.type === types.enum) {
        if (!result.enumerations) {
          result.enumerations = new ParameterMembersElement();
          const { parameterSignatureDetails: details } = context.data;
          context.addWarning('Use of enumerations in "Parameters" section without keyword "Members" violates API Blueprint Spec.', details.sourceMap);
        }
        [nextNode, childRes] = Parsers.ParameterEnumMemberParser.parse(node, context);
        result.enumerations.members.push(childRes);
        return [nextNode, result];
      }


      if (sectionType === SectionTypes.defaultValue) {
        if (types.primitiveTypes.includes(result.type)) {
          context.data.typeForDefaults = 'primitive';
          context.data.valueType = result.type;
        } else {
          context.data.typeForDefaults = result.type;
          context.data.valueType = result.nestedTypes && result.nestedTypes[0] || 'string';
        }
        [nextNode, childRes] = Parsers.DefaultValueParser.parse(node, context);
        delete context.data.typeForDefaults;
        delete context.data.valueType;

        if (result.defaultValue || childRes.length > 1) {
          const { parameterSignatureDetails: details } = context.data;
          context.addWarning('Multiple definitions of "default" value', details.sourceMap);
        }
        result.defaultValue = childRes[0];
      } else {
        [nextNode, childRes] = Parsers.ParameterMembersParser.parse(node, context);
        result.enumerations = childRes;
      }

      return [nextNode, result];
    },

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { name, typeAttributes, defaultValue } = result;
      const { parameterSignatureDetails: details } = context.data;

      context.popFrame();
      if (typeAttributes.includes('required')) {
        if (typeAttributes.includes('optional')) {
          throw new utils.CrafterError(`Parameter "${name}" must not be specified as both required and optional.`, details.sourceMap);
        }

        if (defaultValue) {
          context.addWarning(`Specifying parameter ${name} as required supersedes its default value, declare the parameter as 'optional' to specify its default value.`, details.sourceMap);
        }
      }

      return result;
    },
  });
  return true;
};
