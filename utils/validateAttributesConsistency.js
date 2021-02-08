const { typeAttributes, parameterizedTypeAttributes, permittedValueTypeAttributes } = require('../type-attributes');
const splitTypeAttributes = require('./splitTypeAttributes');

module.exports = function validateAttributesConsistency(context, result, attributeSignatureDetails) {
  if (result.typeAttributes.length === 0) {
    return;
  }

  if (result.isArray() && result.typeAttributes.includes(typeAttributes['fixed-type'])) {
    context.addWarning('fixed-type keyword is redundant', attributeSignatureDetails.sourceMap);
    result.typeAttributes = result.typeAttributes.filter(x => x !== typeAttributes['fixed-type']);
  }

  if (!context.typeExtractingInProgress) {
    const baseType = result.getBaseType();
    const [propertyTypeAttributes, valueTypeAttributes] = splitTypeAttributes(result.typeAttributes);
    const unacceptablePropertyAttributes = propertyTypeAttributes.length > 0 ? propertyTypeAttributes : [];
    const unacceptableValueAttributes = valueTypeAttributes.filter(valueAttr => {
      const valueAttrKey = Array.isArray(valueAttr) ? valueAttr[0] : valueAttr;
      return !permittedValueTypeAttributes[baseType].includes(valueAttrKey);
    });
    const unacceptableAttributes = unacceptablePropertyAttributes.concat(unacceptableValueAttributes);

    if (unacceptableAttributes.length) {
      const attrsList = unacceptableAttributes.map(attr => (Array.isArray(attr) ? `"${attr[0]}"` : `"${attr}"`));
      const warningText = attrsList.length === 1
        ? `Type attribute ${attrsList[0]} is not allowed for a value of type "${baseType}"`
        : `Type attributes ${attrsList.join(', ')} are not allowed for a value of type "${baseType}"`;
      context.addWarning(warningText, attributeSignatureDetails.sourceMap);
    }
  }

  const attributeNamesToCheck = [
    parameterizedTypeAttributes.pattern,
    parameterizedTypeAttributes.format,
    parameterizedTypeAttributes.minimum,
    parameterizedTypeAttributes.maximum,
  ];

  const attributesToCheck = result.typeAttributes
    .filter(attr => Array.isArray(attr) && attributeNamesToCheck.find(a => a.alias === attr[0]) !== undefined)
    .map(a => a[0]);

  attributesToCheck.forEach(attr => {
    const requiredDataType = attributeNamesToCheck.find(a => a.alias === attr).dataType;
    if (!result.isType(requiredDataType)) {
      context.addWarning(`Attribute "${attr}" can be used in ${requiredDataType} value type only.`, attributeSignatureDetails.sourceMap);
    }
  });
};
