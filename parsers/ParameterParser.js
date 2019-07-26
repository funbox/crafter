const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const ParameterElement = require('./elements/ParameterElement');
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

      if (signature.rest) {
        context.data.startOffset = text.length - signature.rest.length;
      }

      const nextChildNode = signature.rest ? node.firstChild : node.firstChild.next;
      const nextNode = nextChildNode || utils.nextNode(node.firstChild);

      return [nextNode, result];
    },

    processDescription(contentNode, context, result) {
      let stopCallback = null;
      const parentNode = contentNode && contentNode.parent;
      const { startOffset } = context.data;
      const allowedSections = [
        Parsers.DefaultValueParser,
        Parsers.ParameterMembersParser,
      ];
      const isContentSection = (node) => SectionTypes.calculateSectionType(node, context, allowedSections) !== SectionTypes.undefined;

      if (!contentNode) {
        return [contentNode, result];
      }

      if (utils.isCurrentNodeOrChild(contentNode, parentNode) && contentNode.type === 'list') {
        contentNode = contentNode.firstChild;
      }

      if (
        result.type === types.enum
        && !isContentSection(contentNode)
        && Parsers.EnumMemberParser.sectionType(contentNode, context) !== SectionTypes.undefined
      ) {
        const { parameterSignatureDetails: details } = context.data;
        context.addWarning('Use of enumerations in "Parameters" section without keyword "Members" violates API Blueprint Spec.', details.sourceMap);
      }

      if (contentNode.type === 'paragraph' || !!startOffset || !isContentSection(contentNode)) {
        stopCallback = curNode => (!utils.isCurrentNodeOrChild(curNode, parentNode) || isContentSection(curNode));
      }

      contentNode.skipLines = startOffset ? 1 : 0;
      const [
        nextNode,
        blockDescriptionEl,
      ] = utils.extractDescription(contentNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, stopCallback, startOffset);

      delete contentNode.skipLines;

      if (blockDescriptionEl) {
        const stringDescriptionEl = new StringElement(blockDescriptionEl.description, blockDescriptionEl.sourceMap);
        if (result.description) {
          result.description.string = utils.appendDescriptionDelimiter(result.description.string);
          result.description = utils.mergeStringElements(result.description, stringDescriptionEl);
        } else {
          result.description = stringDescriptionEl;
        }
      }
      return [nextNode, result];
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
      ]);

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
