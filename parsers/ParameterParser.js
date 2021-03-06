const SectionTypes = require('../SectionTypes');
const { types } = require('../constants');
const utils = require('../utils');
const ParameterElement = require('./elements/ParameterElement');
const StringElement = require('./elements/StringElement');
const { parser: SignatureParser } = require('../SignatureParser');

const UnrecognizedBlockElement = require('./elements/UnrecognizedBlockElement');

module.exports = (Parsers) => {
  Parsers.ParameterParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text, false);

      context.pushFrame();

      const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
      const parameterSignatureDetails = { sourceMap };

      const descriptionEl = signature.description
        ? utils.makeStringElement(signature.description, signature.descriptionOffset, node.firstChild, context)
        : undefined;
      context.data.parameterSignatureDetails = parameterSignatureDetails;
      signature.warnings.forEach(warning => context.addWarning(warning, sourceMap));

      const name = signature.name
        ? utils.makeStringElement(signature.name, signature.nameOffset, node.firstChild, context)
        : null;

      const value = signature.value
        ? utils.makeStringElement(signature.value, signature.valueOffset, node.firstChild, context)
        : null;

      const typeAttributes = signature.typeAttributes.map((attr, index) => {
        const [offset] = signature.typeAttributesOffsetsAndLengths[index];
        return utils.makeStringElement(attr, offset, node.firstChild, context);
      });

      const title = signature.type
        ? utils.makeStringElement(signature.type, signature.typeOffset, node.firstChild, context)
        : new StringElement('string');

      const result = new ParameterElement(
        name,
        value,
        title,
        typeAttributes,
        descriptionEl,
        sourceMap,
      );

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
      const { sourceLines, sourceBuffer, linefeedOffsets, filename } = context;
      const [
        nextNode,
        blockDescriptionEl,
      ] = utils.extractDescription(contentNode, sourceLines, sourceBuffer, linefeedOffsets, filename, stopCallback, startOffset);

      delete contentNode.skipLines;

      if (blockDescriptionEl) {
        // In this case, a StringElement is used as a description container, not a DescriptionElement,
        // because this description then will be in the `meta.description` field of a PropertyMemberElement instance.
        // According to the specification, such a field must be an instance of a StringElement
        // https://apielements.org/en/latest/element-definitions.html#reserved-meta-properties
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
      if (node.type === 'item') { // TODO: move node.type check to AbstractParser
        const text = utils.nodeText(node.firstChild, context.sourceLines);

        try {
          const signature = new SignatureParser(text, false);
          if (signature.typeAttributes.length <= 2) {
            return SectionTypes.parameter;
          }
        } catch (e) {
          if (!(e instanceof utils.SignatureError)) throw e;
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

          if (result.defaultValue) {
            const sourceMap = utils.makeGenericSourceMap(node, context.sourceLines, context.sourceBuffer, context.linefeedOffsets, context.filename);
            result.unrecognizedBlocks.push(new UnrecognizedBlockElement(sourceMap));
          } else if (childRes.length > 1) {
            childRes.slice(1).forEach(child => result.unrecognizedBlocks.push(new UnrecognizedBlockElement(child.sourceMap)));
          }
        }

        if (!result.defaultValue) result.defaultValue = childRes[0];
      } else {
        [nextNode, childRes] = Parsers.ParameterMembersParser.parse(node, context);
        result.enumerations = childRes;
      }

      return [nextNode, result];
    },

    finalize(context, result) {
      const { name, type, defaultValue } = result;
      const typeAttributes = result.typeAttributes.map(attr => attr.string);
      const { parameterSignatureDetails: details } = context.data;

      context.popFrame();

      if (['array', 'object'].includes(type)) {
        context.addWarning('Using non-primitive data types for parameters violates API Blueprint Spec.', details.sourceMap);
      }

      if (typeAttributes.includes('required')) {
        if (typeAttributes.includes('optional') && !context.languageServerMode) {
          throw new utils.CrafterError(`Parameter "${name.string}" must not be specified as both required and optional.`, details.sourceMap);
        }

        if (defaultValue) {
          context.addWarning(`Specifying parameter "${name.string}" as required supersedes its default value, declare the parameter as 'optional' to specify its default value.`, details.sourceMap);
        }
      }

      return result;
    },
  });
  return true;
};
