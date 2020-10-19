const SectionTypes = require('../SectionTypes');
const utils = require('../utils');
const { splitValues } = require('../SignatureParser');
const DefaultValueElement = require('./elements/DefaultValueElement');

const defaultValueRegex = /^[Dd]efault:\s*`?(.+?)`?$/;
const listTypedDefaultValueRegex = /^[Dd]efault$/;

module.exports = (Parsers) => {
  Parsers.DefaultValueParser = Object.assign(Object.create(require('./AbstractParser')), {
    processSignature(node, context) {
      const text = node.type === 'heading'
        ? utils.headerText(node, context.sourceLines)[0]
        : utils.nodeText(node.firstChild, context.sourceLines);
      const valMatch = defaultValueRegex.exec(text);
      const values = valMatch ? splitValues(valMatch[1]) : undefined;

      const result = [];

      if (values) {
        // TODO Сделать разные sourceMap на каждый SampleValueElement
        const sourceMap = utils.makeGenericSourceMap(node.firstChild, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

        switch (context.data.typeForDefaults) {
          case 'primitive':
          case 'enum':
            values.forEach((value) => {
              const converted = utils.convertType(value, context.data.valueType);

              if (converted.valid) {
                result.push(new DefaultValueElement(converted.value, context.data.valueType, sourceMap));
              } else {
                context.addTypeMismatchWarning(value, context.data.valueType, sourceMap);
              }
            });
            break;
          case 'array': {
            const preparedValues = values.reduce((res, v) => {
              const converted = utils.convertType(v, context.data.valueType);

              if (converted.valid) {
                res.push(converted.value);
              } else {
                context.addTypeMismatchWarning(v, context.data.valueType, sourceMap);
              }
              return res;
            }, []);
            const sourceMaps = preparedValues.map(() => sourceMap);
            result.push(new DefaultValueElement(preparedValues, context.data.valueType, sourceMaps));
            break;
          }

          // no default
        }
      }

      return [(node.firstChild.next && node.firstChild.next.firstChild) || utils.nextNode(node), result];
    },

    sectionType(node, context) {
      if (node.type === 'item') {
        const text = utils.nodeText(node.firstChild, context.sourceLines);
        if (defaultValueRegex.test(text) || listTypedDefaultValueRegex.test(text)) {
          return SectionTypes.defaultValue;
        }
      }
      if (node.type === 'heading') {
        const text = utils.headerText(node, context.sourceLines)[0];
        if (listTypedDefaultValueRegex.test(text)) {
          return SectionTypes.defaultValue;
        }
      }

      return SectionTypes.undefined;
    },

    nestedSectionType(node) {
      if (node.type === 'item' || node.type === 'paragraph') {
        return SectionTypes.defaultValueMember;
      }

      return SectionTypes.undefined;
    },

    processDescription(node, context, result) {
      return [node, result];
    },

    processNestedSection(node, context, result) {
      const textNode = node.type === 'item' ? node.firstChild : node;
      const text = utils.nodeText(textNode, context.sourceLines);
      const sourceMap = utils.makeGenericSourceMap(textNode, context.sourceLines, context.sourceBuffer, context.linefeedOffsets);

      switch (context.data.typeForDefaults) {
        case 'primitive':
        case 'enum': {
          const converted = utils.convertType(text, context.data.valueType);

          if (converted.valid) {
            result.push(new DefaultValueElement(converted.value, context.data.valueType, sourceMap));
          } else {
            context.addTypeMismatchWarning(text, context.data.valueType, sourceMap);
          }
          break;
        }
        case 'array': {
          const converted = utils.convertType(text, context.data.valueType);

          if (converted.valid) {
            if (!result.length) {
              result.push(new DefaultValueElement([], context.data.valueType, []));
            }
            const defaultEl = result[result.length - 1];
            defaultEl.value.push(converted.value);
            defaultEl.sourceMap.push(sourceMap);
          } else {
            context.addTypeMismatchWarning(text, context.data.valueType, sourceMap);
          }

          break;
        }
        // no default
      }

      return [utils.nextNode(node), result];
    },

    isUnexpectedNode() {
      return false;
    },
    allowLeavingNode: false,
  });
  return true;
};
