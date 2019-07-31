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
    let useSample = false;
    let useDefault = false;
    let omitValue = element.isSample || element.isDefault || element.isArray();

    if (!element.isStandardType()) {
      const namedElement = context.typeResolver.types[element.type];
      sampleElements = sampleElements.concat(namedElement.samples || []);
      defaultElements = defaultElements.concat(namedElement.default ? [namedElement.default] : []);
      useSample = !!sampleElements.length;
      useDefault = !!defaultElements.length;
    }

    if (value === false || !!value) {
      if (element.type && element.isObject()) {
        context.addWarning('"object" with value definition. You should use type definition without value, e.g., "+ key (object)"', context.data.attributeSignatureDetails.sourceMap);
        omitValue = true;
      } else {
        const [inlineSamples, inlineDefaults] = getSamplesAndDefaultsFromInline(element, value, context, context.data.attributeSignatureDetails.sourceMap);
        sampleElements = sampleElements.concat(inlineSamples);
        defaultElements = defaultElements.concat(inlineDefaults);
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

    useSample = useSample || sampleElements.length && !element.isDefault && (element.isSample || element.isArray());
    useDefault = useDefault || element.isDefault && defaultElements.length;

    element.samples = useSample ? sampleElements : null;
    element.default = useDefault ? defaultElements[0] : null;

    if (useDefault && defaultElements.length > 1) {
      context.addWarning('Multiple definitions of "default" value', context.data.attributeSignatureDetails.sourceMap);
    }

    element.value = omitValue ? null : convertType(value, element.baseType).value;
  },
};

function getSamplesAndDefaultsFromInline(element, value, context, sourceMap) {
  let inlineValuesType;
  let sampleElements;
  let defaultElements;

  if (element.isArray() || element.isEnum()) {
    inlineValuesType = element.nestedTypes.find(type => (context.typeResolver.getStandardBaseType(type) !== 'object')) || 'string';
  } else {
    inlineValuesType = element.type || 'string';
  }

  const inlineValues = splitValues(value).reduce((res, v) => {
    const converted = convertType(v, inlineValuesType);

    if (converted.valid) {
      res.push(converted.value);
    } else {
      context.addTypeMismatchWarning(v, inlineValuesType, sourceMap);
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
  return [sampleElements, defaultElements];
}

module.exports = ValueMemberProcessor;
