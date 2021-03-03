module.exports = function convertType(value, requiredType, ownType) {
  if (value === undefined || value === null) return { valid: false, value };

  const typeToCast = ownType || requiredType;

  switch (typeToCast) {
    case 'number':
      if (Number.isNaN(Number(value))) {
        return { valid: false, value };
      }
      return { valid: true, value: Number(value) };
    case 'boolean':
      if (!['true', 'false'].includes(value)) {
        return { valid: false, value };
      }
      return { valid: true, value: (value === 'true') };
    case 'string':
      return { valid: true, value: String(value) };
    default:
      return { valid: true, value };
  }
};
