const { splitValues } = require('./SignatureParser');
const { CrafterError, convertType } = require('./utils');

const ArrayElement = require('./parsers/elements/ArrayElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const DefaultValueElement = require('./parsers/elements/DefaultValueElement');
const ValueMemberElement = require('./parsers/elements/ValueMemberElement');
const DefaultValueProcessor = require('./parsers/DefaultValueProcessor');

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
    let sampleElements = [];
    let defaultElement;

    if (value === false || !!value) {
      let inlineValuesType;
      if (element.isComplex()) {
        // Видимо для массива и enum-а
        // TODO Для объектов примеры считаются string-ами. Нужно либо запретить, либо проверять
        inlineValuesType = element.nestedTypes.length === 1 ? element.nestedTypes[0] : 'string';
      } else {
        inlineValuesType = element.type || 'string';
      }

      // TODO Добавить проверку на то, что для объектов и сложных массивов не задан пример
      const inlineValues = splitValues(value).map(val => convertType(val, inlineValuesType).value);
      // TODO Реализовать SourceMap-ы

      if (element.isArray()) {
        sampleElements = [new SampleValueElement(inlineValues, inlineValuesType, [])];
      } else {
        sampleElements = inlineValues.map(v => new SampleValueElement(v, inlineValuesType, null));
      }

      defaultElement = new DefaultValueElement(inlineValues, inlineValuesType);
      const defaultValueProcessor = new DefaultValueProcessor(defaultElement, inlineValuesType);
      defaultValueProcessor.buildDefaultFor(element.type, context.sourceMapsEnabled);
    }

    if (element.isArray()) {
      const members = element.nestedTypes.map((t) => {
        const el = new ValueMemberElement(t);
        try {
          ValueMemberProcessor.fillBaseType(context, el);
        } catch (error) {
          if (!error.sourceMap) {
            error.sourceMap = element.sourceMap;
          }
          throw error;
        }
        return el;
      });
      element.content = new ArrayElement(members);
    }

    element.samples = sampleElements.length && !element.isDefault && (element.isSample || element.isArray()) ? sampleElements : null;
    element.default = element.isDefault && defaultElement;
    element.value = (element.isSample || element.isDefault || element.isArray()) ? null : convertType(value, element.baseType).value;
  },
};

module.exports = ValueMemberProcessor;
