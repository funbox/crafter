module.exports = function isTypeUsedByElement(typeName, typeElement, dataTypes) {
  if (typeElement.nestedTypes && typeElement.nestedTypes.find(({ type }) => type === typeName)) return true;

  const propertyMembers = typeElement.content && typeElement.content.propertyMembers;
  if (!propertyMembers) {
    return false;
  }

  return propertyMembers.some(pm => pm.value && (
    pm.value.type === typeName
    || dataTypes[pm.value.type] && isTypeUsedByElement(typeName, dataTypes[pm.value.type], dataTypes)
    || isTypeUsedByElement(typeName, pm.value, dataTypes)
  ));
};
