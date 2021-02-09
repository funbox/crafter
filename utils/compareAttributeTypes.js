module.exports = function compareAttributeTypes(baseAttr, childAttr) {
  const baseType = baseAttr.type;

  switch (baseType) {
    case 'number':
      if (childAttr.type) return true; // если для enumMember задан свой тип, то всё ок
      if (Number.isNaN(Number(childAttr.value))) return false;
      break;
    default:
      return true;
  }

  return true;
};
