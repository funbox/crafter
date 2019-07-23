const { splitValues } = require('./SignatureParser');
const { CrafterError, convertType } = require('./utils');

const ArrayElement = require('./parsers/elements/ArrayElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const DefaultValueElement = require('./parsers/elements/DefaultValueElement');
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

    const { value } = element;
    let sampleElements = [];
    let defaultElements = [];

    if (value === false || !!value) {
      let inlineValuesType;
      if (element.isComplex()) {
        inlineValuesType = element.nestedTypes.length === 1 ? element.nestedTypes[0] : 'string';
      } else {
        inlineValuesType = element.type || 'string';
      }

      const inlineValues = splitValues(value).reduce((res, v) => {
        const converted = convertType(v, inlineValuesType);

        if (converted.valid) {
          res.push(converted.value);
        }
        return res;
      }, []);

      // TODO Реализовать SourceMap-ы

      if (element.isArray()) {
        sampleElements = [new SampleValueElement(inlineValues, inlineValuesType, [])];
        defaultElements = [new DefaultValueElement(inlineValues, inlineValuesType, [])];
      } else {
        sampleElements = inlineValues.map(v => new SampleValueElement(v, inlineValuesType, null));
        defaultElements = inlineValues.map(v => new DefaultValueElement(v, inlineValuesType, null));
      }
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

    if (element.isDefault && defaultElements.length) {
      if (defaultElements.length > 1) {
        context.addWarning('Multiple definitions of "default" value', context.data.attributeSignatureDetails.sourceMap);
      }
      element.default = defaultElements[0];
    }

    element.value = (element.isSample || element.isDefault || element.isArray()) ? null : convertType(value, element.baseType).value;
  },
};

module.exports = ValueMemberProcessor;
