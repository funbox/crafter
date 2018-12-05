const { splitValues } = require('./SignatureParser');
const { CrafterError } = require('./utils');

const ArrayElement = require('./parsers/elements/ArrayElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const ValueMemberElement = require('./parsers/elements/ValueMemberElement');

const ValueMemberProcessor = {
  fillBaseType(context, element) {
    if (!element.isStandardType()) {
      element.baseType = context.typeResolver.getStandardBaseType(element.type);
    } else {
      element.baseType = element.type;
    }

    if (!(element.isArray() || element.isEnum()) && element.nestedTypes.length > 0) {
      throw new CrafterError(`Invalid type ${element.rawType}. Nested types should be present only for types which are sub typed from either array or enum structure type`);
    }

    if (element.isArray()) {
      const members = element.nestedTypes.map((t) => {
        const el = new ValueMemberElement(t);
        ValueMemberProcessor.fillBaseType(context, el);
        return el;
      });

      element.content = new ArrayElement(members);

      if (element.value) {
        const inlineValues = splitValues(element.value);
        const inlineValuesType = element.nestedTypes.length === 1 ? element.nestedTypes[0] : 'string';
        const sampleElement = new SampleValueElement(inlineValues, inlineValuesType);
        element.samples = [sampleElement];
        element.value = null;
      }
    }
  },
};

module.exports = ValueMemberProcessor;
