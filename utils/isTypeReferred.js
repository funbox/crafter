module.exports = function isTypeReferred(typeName, schema) {
  return Object.entries(schema).some(([key, value]) => {
    if (key === '$ref' && value === `#/definitions/${typeName}`) return true;

    if (typeof value === 'object' && value !== null) {
      return isTypeReferred(typeName, value);
    }

    return false;
  });
};
