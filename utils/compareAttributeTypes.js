module.exports = function compareAttributeTypes(baseAttr, childAttr) {
  const baseType = baseAttr.type;

  switch (baseType) {
    case 'number':
      if (childAttr.type) return true; // enum member can have its own type
      if (Number.isNaN(Number(childAttr.value))) return false;
      break;
    default:
      return true;
  }

  return true;
};
