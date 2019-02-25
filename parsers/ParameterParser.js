const SectionTypes = require('../SectionTypes');
const types = require('../types');
const utils = require('../utils');
const ParameterElement = require('./elements/ParameterElement');
const StringElement = require('./elements/StringElement');
const SourceMapElement = require('./elements/SourceMapElement');
const { parser: SignatureParser } = require('../SignatureParser');

module.exports = (Parsers) => {
  Parsers.ParameterParser = Object.assign(Object.create(require('./AbstractParser')), {
    allowLeavingNode: false,

    processSignature(node, context) {
      const text = utils.nodeText(node.firstChild, context.sourceLines);
      const signature = new SignatureParser(text);

      context.pushFrame();
      const parameterSignatureDetails = utils.getDetailsForLogger(node.firstChild);
      let descriptionEl;
      if (signature.description) {
        descriptionEl = new StringElement(signature.description);
      }
      context.data.parameterSignatureDetails = parameterSignatureDetails;
      signature.warnings.forEach(warning => context.logger.warn(warning, parameterSignatureDetails));

      const result = new ParameterElement(
        signature.name,
        signature.value,
        signature.type,
        signature.typeAttributes,
        descriptionEl,
      );

      if (context.sourceMapsEnabled) {
        result.sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines);
        if (result.description) {
          result.description.sourceMap = utils.makeSourceMapForLine(node.firstChild, context.sourceLines);
        }
      }

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
      const sectionType = SectionTypes.calculateSectionType(node, context, [
        Parsers.DefaultValueParser,
        Parsers.ParameterMembersParser,
        Parsers.MSONAttributeParser,
      ]);
      if (sectionType === SectionTypes.msonAttribute && result.type !== types.enum) {
        const descriptionContentNode = node.parent;
        const stopCallback = curNode => (!utils.isCurrentNodeOrChild(curNode, descriptionContentNode));
        const [
          nextNode,
          blockDescriptionEl,
        ] = utils.extractDescription(node, context.sourceLines, context.sourceMapsEnabled, stopCallback);

        if (blockDescriptionEl) {
          const stringDescriptionEl = new StringElement(blockDescriptionEl.description, blockDescriptionEl.sourceMap);

          if (result.description) {
            result.description.string = utils.appendDescriptionDelimiter(result.description.string);
            result.description = mergeStringElements(result.description, stringDescriptionEl);
          } else {
            result.description = stringDescriptionEl;
          }
        }

        return [nextNode, result];
      }

      return [node, result];
    },

    isUnexpectedNode() {
      return false;
    },

    finalize(context, result) {
      const { name, typeAttributes, defaultValue } = result;
      const { parameterSignatureDetails } = context.data;

      context.popFrame();
      if (typeAttributes.includes('required')) {
        if (typeAttributes.includes('optional')) {
          throw new utils.CrafterError(`Parameter "${name}" must not be specified as both required and optional.`);
        }

        if (defaultValue) {
          context.logger.warn(`Specifying parameter ${name} as required supersedes its default value, declare the parameter as 'optional' to specify its default value.`, parameterSignatureDetails);
        }
      }

      return result;
    },
  });
};

function mergeStringElements(first, second) {
  const merged = new StringElement();
  merged.string = first.string + second.string;
  if (first.sourceMap && second.sourceMap) {
    merged.sourceMap = new SourceMapElement();
    merged.sourceMap.byteBlocks = [...first.sourceMap.byteBlocks, ...second.sourceMap.byteBlocks];
  }
  return merged;
}
