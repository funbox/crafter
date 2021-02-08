module.exports = function splitTypeAttributes(typeAttrs) {
  const propertyAttributes = ['required', 'optional']; // see https://apielements.org/en/latest/element-definitions.html#member-element
  const propertyTypeAttributes = [];
  const propertyTypeAttributesIndexes = [];
  const valueTypeAttributes = [];
  const valueTypeAttributesIndexes = [];

  typeAttrs.forEach((attr, index) => {
    if (propertyAttributes.includes(attr)) {
      propertyTypeAttributes.push(attr);
      propertyTypeAttributesIndexes.push(index);
    } else {
      valueTypeAttributes.push(attr);
      valueTypeAttributesIndexes.push(index);
    }
  });
  return [propertyTypeAttributes, valueTypeAttributes, propertyTypeAttributesIndexes, valueTypeAttributesIndexes];
};
