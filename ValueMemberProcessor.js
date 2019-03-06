const { splitValues } = require('./SignatureParser');
const { CrafterError, convertType } = require('./utils');

const ArrayElement = require('./parsers/elements/ArrayElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const DefaultValueElement = require('./parsers/elements/DefaultValueElement');
const ValueMemberElement = require('./parsers/elements/ValueMemberElement');
const SampleValueProcessor = require('./parsers/SampleValueProcessor');

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

    const { value } = element;
    let sampleElement;
    let defaultElement;

    if (value === false || !!value) {
      let inlineValuesType;
      if (element.isComplex()) {
        inlineValuesType = element.nestedTypes.length === 1 ? element.nestedTypes[0] : 'string';
      } else {
        inlineValuesType = element.type || 'string';
      }
      const inlineValues = splitValues(value).map(val => convertType(val, inlineValuesType).value);
      sampleElement = new SampleValueElement(inlineValues);
      defaultElement = new DefaultValueElement(inlineValues, inlineValuesType);
      const sampleValueProcessor = new SampleValueProcessor(sampleElement, inlineValuesType);
      sampleValueProcessor.buildSamplesFor(element.type);
    }

    if (element.isArray()) {
      const members = element.nestedTypes.map((t) => {
        const el = new ValueMemberElement(t);
        ValueMemberProcessor.fillBaseType(context, el);
        return el;
      });
      element.content = new ArrayElement(members);
    }

    element.samples = sampleElement && (element.isSample || element.isArray()) ? [sampleElement] : null;
    element.default = element.isDefault && defaultElement;
    element.value = (element.isSample || element.isDefault || element.isArray()) ? null : value;
  },
};

module.exports = ValueMemberProcessor;
