const { splitValues } = require('./SignatureParser');
const { CrafterError, convertType, makeSourceMapsForInlineValues } = require('./utils');
const { types } = require('./constants');

const ArrayElement = require('./parsers/elements/ArrayElement');
const SampleValueElement = require('./parsers/elements/SampleValueElement');
const DefaultValueElement = require('./parsers/elements/DefaultValueElement');

const typeAttrsToPropagate = ['fixed', 'fixedType'];

const ValueMemberProcessor = {
  /**
   * @param {Context} context
   * @param {ValueMemberElement} element
   * @param {boolean} isProperty
   */
  fillBaseType(context, element, isProperty = false) {
    if (!element.isStandardType()) {
      try {
        element.baseType = context.typeResolver.getStandardBaseType(element.type);
      } catch (e) {
        if (context.languageServerMode) {
          element.baseType = element.nestedTypes.length ? types.array : types.object;
        } else {
          throw e;
        }
      }
    } else {
      element.baseType = element.type;
    }

    if (!(element.isArray() || element.isEnum()) && element.nestedTypes.length > 0 && !context.languageServerMode) {
      throw new CrafterError(`Invalid type ${element.rawType}. Nested types should be present only for types which are sub typed from either array or enum structure type`);
    }

    const { value } = element;
    let sampleElements = [];
    let defaultElements = [];

    if (!element.isStandardType()) {
      const namedElement = context.typeResolver.types[element.type];
      if (namedElement) {
        sampleElements = sampleElements.concat(namedElement.samples || []);
        defaultElements = defaultElements.concat(namedElement.default ? [namedElement.default] : []);
        const propagatedTypeAttributes = Array.isArray(namedElement.typeAttributes)
          ? namedElement.typeAttributes.filter(attr => typeAttrsToPropagate.includes(attr))
          : [];
        element.propagatedTypeAttributes = propagatedTypeAttributes;
      }
    }

    if (value != null) {
      if (element.type && element.isObject()) {
        context.addWarning('"object" with value definition. You should use type definition without value, e.g., "+ key (object)"', context.data.attributeSignatureDetails.sourceMap);
      } else if (isProperty || element.isSample || element.isDefault) {
        const [inlineSamples, inlineDefaults] = getSamplesAndDefaultsFromInline(element, value, context);
        if (isProperty || element.isSample) {
          sampleElements = sampleElements.concat(inlineSamples);
        }
        if (element.isDefault) {
          defaultElements = defaultElements.concat(inlineDefaults);
        }
      }
    }

    if (element.isArray()) {
      element.nestedTypes.forEach((el) => {
        try {
          ValueMemberProcessor.fillBaseType(context, el);
        } catch (error) {
          if (!error.sourceMap) {
            error.sourceMap = element.sourceMap;
          }
          throw error;
        }
      });
      element.content = new ArrayElement(element.nestedTypes.slice());
    }

    element.samples = sampleElements;
    element.default = defaultElements.length > 0 ? defaultElements[0] : null;

    if (defaultElements.length > 1) {
      context.addWarning('Multiple definitions of "default" value', context.data.attributeSignatureDetails.sourceMap);
    }

    element.value = convertType(value, element.baseType).value;
  },
};

function getSamplesAndDefaultsFromInline(element, value, context) {
  let inlineValuesType;
  let sampleElements;
  let defaultElements;

  if (element.isArray() || element.isEnum()) {
    const [, baseNestedTypes] = context.typeResolver.getStandardBaseAndNestedTypes(element.type);
    const nestedTypesNames = element.nestedTypes.map(nestedType => nestedType.type);
    const nestedTypes = Array.from(new Set([...nestedTypesNames, ...baseNestedTypes]));
    inlineValuesType = nestedTypes.find(type => (context.typeResolver.getStandardBaseType(type) !== 'object')) || 'string';
  } else {
    inlineValuesType = element.baseType || 'string';
  }

  const inlineValues = splitValues(value).reduce((res, v) => {
    const converted = convertType(v, inlineValuesType);

    if (converted.valid) {
      res.push(converted.value);
    } else {
      context.addTypeMismatchWarning(v, inlineValuesType, context.data.attributeSignatureDetails.sourceMap);
    }
    return res;
  }, []);

  const sourceMaps = makeSourceMapsForInlineValues(
    value,
    inlineValues,
    context.data.attributeSignatureDetails.node,
    context.sourceLines,
    context.sourceBuffer,
    context.linefeedOffsets,
    context.filename,
  );

  if (element.isArray()) {
    sampleElements = [new SampleValueElement(inlineValues, inlineValuesType, sourceMaps)];
    defaultElements = [new DefaultValueElement(inlineValues, inlineValuesType, sourceMaps)];
  } else {
    sampleElements = inlineValues.map(v => new SampleValueElement(v, inlineValuesType, sourceMaps[0]));
    defaultElements = inlineValues.map(v => new DefaultValueElement(v, inlineValuesType, sourceMaps[0]));
  }
  return [sampleElements, defaultElements];
}

module.exports = ValueMemberProcessor;
